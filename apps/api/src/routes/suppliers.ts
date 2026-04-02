import { Router } from 'express'
import { pool } from '../db/client.js'

export const suppliersRouter = Router()

suppliersRouter.get('/', async (_, res) => {
  const result = await pool.query(
    `
    SELECT id, name, contact_email, contact_phone, lead_time_days
    FROM suppliers
    ORDER BY name ASC;
    `,
  )

  return res.json({
    data: result.rows,
  })
})
