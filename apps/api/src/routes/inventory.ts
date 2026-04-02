import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/client.js'

const movementSchema = z.object({
  inventory_item_id: z.number().int().positive(),
  movement_type: z.enum(['sale', 'return', 'adjustment']),
  quantity_changed: z.number().int(),
  notes: z.string().max(500).optional(),
})

export const inventoryRouter = Router()

const createInventoryItemSchema = z.object({
  drug_id: z.number().int().positive(),
  batch_number: z.string().max(100).optional(),
  expiry_date: z.string().min(10),
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
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Inventory item not found' })
    }

    const current = currentResult.rows[0]
    const nextQuantity = current.quantity_on_hand + payload.quantity_changed

    if (nextQuantity < 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Quantity cannot go below zero' })
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
