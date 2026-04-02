import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/client.js'

const acknowledgeSchema = z.object({
  alert_id: z.number().int().positive(),
})

export const alertsRouter = Router()

alertsRouter.get('/expiry', async (_, res) => {
  const result = await pool.query(
    `
    SELECT
      ea.id,
      ea.alert_tier,
      ea.days_to_expiry,
      ea.status,
      ea.last_triggered_at,
      ii.id AS inventory_item_id,
      ii.batch_number,
      ii.expiry_date,
      ii.quantity_on_hand,
      d.id AS drug_id,
      d.brand_name,
      d.generic_name,
      d.reorder_level
    FROM expiry_alerts ea
    INNER JOIN inventory_items ii ON ii.id = ea.inventory_item_id
    INNER JOIN drugs d ON d.id = ii.drug_id
    WHERE ea.status = 'open'
    ORDER BY ea.days_to_expiry ASC, ea.last_triggered_at DESC;
    `,
  )

  return res.json({ data: result.rows })
})

alertsRouter.post('/acknowledge', async (req, res) => {
  const parsed = acknowledgeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const result = await pool.query(
    `
    UPDATE expiry_alerts
    SET status = 'acknowledged',
        acknowledged_by = $1,
        acknowledged_at = NOW()
    WHERE id = $2 AND status = 'open'
    RETURNING id, status, acknowledged_by, acknowledged_at;
    `,
    [req.user.id, parsed.data.alert_id],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Open alert not found' })
  }

  return res.json({
    message: 'Alert acknowledged',
    data: result.rows[0],
  })
})
