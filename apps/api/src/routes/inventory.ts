import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/client.js'

class RouteError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const movementSchema = z.object({
  inventory_item_id: z.number().int().positive(),
  movement_type: z.enum(['sale', 'return', 'adjustment']),
  quantity_changed: z.number().int(),
  notes: z.string().max(500).optional(),
})

export const inventoryRouter = Router()

function isValidIsoDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(parsed.getTime())) return false

  const roundTrip = parsed.toISOString().slice(0, 10)
  return roundTrip === value
}

const createInventoryItemSchema = z.object({
  drug_id: z.number().int().positive(),
  batch_number: z.string().max(100).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expiry_date must be in YYYY-MM-DD format'),
  quantity_on_hand: z.number().int().nonnegative(),
})

const bulkImportSchema = z.object({
  rows: z.array(createInventoryItemSchema).min(1).max(2000),
})

inventoryRouter.get('/', async (_, res) => {
  const result = await pool.query(
    `
    SELECT
      ii.id,
      ii.batch_number,
      ii.expiry_date,
      ii.quantity_on_hand,
      d.id AS drug_id,
      d.brand_name,
      d.generic_name,
      d.reorder_level,
      d.cost_price,
      d.selling_price
    FROM inventory_items ii
    INNER JOIN drugs d ON d.id = ii.drug_id
    ORDER BY ii.expiry_date ASC;
    `,
  )

  return res.json({
    data: result.rows,
  })
})

inventoryRouter.post('/movement', async (req, res) => {
  const parsed = movementSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  const payload = parsed.data
  if (payload.movement_type === 'sale' && payload.quantity_changed >= 0) {
    return res.status(400).json({ message: 'Sale movement must have a negative quantity_changed' })
  }
  if (payload.movement_type === 'return' && payload.quantity_changed <= 0) {
    return res.status(400).json({ message: 'Return movement must have a positive quantity_changed' })
  }

  const actorId = req.user?.id
  if (!actorId) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const currentResult = await client.query<{
      id: number
      quantity_on_hand: number
    }>(
      'SELECT id, quantity_on_hand FROM inventory_items WHERE id = $1 FOR UPDATE',
      [payload.inventory_item_id],
    )

    if (!currentResult.rows[0]) {
      throw new RouteError(404, 'Inventory item not found')
    }

    const current = currentResult.rows[0]
    const nextQuantity = current.quantity_on_hand + payload.quantity_changed

    if (nextQuantity < 0) {
      throw new RouteError(400, 'Quantity cannot go below zero')
    }

    const updateResult = await client.query(
      `
      UPDATE inventory_items
      SET quantity_on_hand = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, quantity_on_hand, updated_at;
      `,
      [nextQuantity, payload.inventory_item_id],
    )

    await client.query(
      `
      INSERT INTO stock_movements (inventory_item_id, user_id, movement_type, quantity_changed, notes)
      VALUES ($1, $2, $3, $4, $5);
      `,
      [
        payload.inventory_item_id,
        actorId,
        payload.movement_type,
        payload.quantity_changed,
        payload.notes ?? null,
      ],
    )

    await client.query('COMMIT')
    return res.json({
      message: 'Inventory updated',
      inventory_item: updateResult.rows[0],
    })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof RouteError) {
      return res.status(error.status).json({ message: error.message })
    }
    throw error
  } finally {
    client.release()
  }
})

inventoryRouter.post('/', async (req, res) => {
  const parsed = createInventoryItemSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  const payload = parsed.data
  if (!isValidIsoDate(payload.expiry_date)) {
    return res.status(400).json({ message: 'expiry_date must be a valid date (YYYY-MM-DD)' })
  }
  const result = await pool.query(
    `
    INSERT INTO inventory_items (drug_id, batch_number, expiry_date, quantity_on_hand)
    VALUES ($1, $2, $3::date, $4)
    RETURNING id, drug_id, batch_number, expiry_date, quantity_on_hand;
    `,
    [
      payload.drug_id,
      payload.batch_number ?? null,
      payload.expiry_date,
      payload.quantity_on_hand,
    ],
  )

  return res.status(201).json(result.rows[0])
})

inventoryRouter.post('/import-csv', async (req, res) => {
  const parsed = bulkImportSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  const rows = parsed.data.rows
  for (const row of rows) {
    if (!isValidIsoDate(row.expiry_date)) {
      return res.status(400).json({ message: `Invalid expiry_date for drug_id ${row.drug_id}. Use YYYY-MM-DD` })
    }
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const inserted = []
    for (const row of rows) {
      const result = await client.query(
        `
        INSERT INTO inventory_items (drug_id, batch_number, expiry_date, quantity_on_hand)
        VALUES ($1, $2, $3::date, $4)
        RETURNING id, drug_id, batch_number, expiry_date, quantity_on_hand;
        `,
        [row.drug_id, row.batch_number ?? null, row.expiry_date, row.quantity_on_hand],
      )
      inserted.push(result.rows[0])
    }

    await client.query('COMMIT')
    return res.status(201).json({
      message: `Imported ${inserted.length} inventory rows`,
      count: inserted.length,
      data: inserted,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})
