import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/client.js'

const createDrugSchema = z.object({
  brand_name: z.string().min(2),
  generic_name: z.string().min(2),
  supplier_id: z.number().int().positive().nullable().optional(),
  cost_price: z.number().nonnegative().default(0),
  selling_price: z.number().nonnegative().default(0),
  reorder_level: z.number().int().nonnegative().default(0),
})

export const drugsRouter = Router()

const updateDrugSchema = z.object({
  brand_name: z.string().min(2).optional(),
  generic_name: z.string().min(2).optional(),
  supplier_id: z.number().int().positive().nullable().optional(),
  cost_price: z.number().nonnegative().optional(),
  selling_price: z.number().nonnegative().optional(),
  reorder_level: z.number().int().nonnegative().optional(),
})

drugsRouter.get('/', async (_, res) => {
  const result = await pool.query(
    `
    SELECT d.id, d.brand_name, d.generic_name, d.cost_price, d.selling_price, d.reorder_level,
           s.id AS supplier_id, s.name AS supplier_name
    FROM drugs d
    LEFT JOIN suppliers s ON s.id = d.supplier_id
    ORDER BY d.id DESC;
    `,
  )

  return res.json({
    data: result.rows,
  })
})

drugsRouter.post('/', async (req, res) => {
  const parsed = createDrugSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  const payload = parsed.data
  const result = await pool.query(
    `
    INSERT INTO drugs (brand_name, generic_name, supplier_id, cost_price, selling_price, reorder_level)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, brand_name, generic_name, supplier_id, cost_price, selling_price, reorder_level;
    `,
    [
      payload.brand_name,
      payload.generic_name,
      payload.supplier_id ?? null,
      payload.cost_price,
      payload.selling_price,
      payload.reorder_level,
    ],
  )

  return res.status(201).json(result.rows[0])
})

drugsRouter.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid drug id' })
  }

  const parsed = updateDrugSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  const payload = parsed.data
  const fields: string[] = []
  const values: Array<string | number | null> = []

  if (payload.brand_name !== undefined) {
    values.push(payload.brand_name)
    fields.push(`brand_name = $${values.length}`)
  }
  if (payload.generic_name !== undefined) {
    values.push(payload.generic_name)
    fields.push(`generic_name = $${values.length}`)
  }
  if (payload.supplier_id !== undefined) {
    values.push(payload.supplier_id ?? null)
    fields.push(`supplier_id = $${values.length}`)
  }
  if (payload.cost_price !== undefined) {
    values.push(payload.cost_price)
    fields.push(`cost_price = $${values.length}`)
  }
  if (payload.selling_price !== undefined) {
    values.push(payload.selling_price)
    fields.push(`selling_price = $${values.length}`)
  }
  if (payload.reorder_level !== undefined) {
    values.push(payload.reorder_level)
    fields.push(`reorder_level = $${values.length}`)
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'No fields provided to update' })
  }

  values.push(id)
  const result = await pool.query(
    `
    UPDATE drugs
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING id, brand_name, generic_name, supplier_id, cost_price, selling_price, reorder_level;
    `,
    values,
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Drug not found' })
  }

  return res.json(result.rows[0])
})
