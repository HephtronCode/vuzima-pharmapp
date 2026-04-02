import { Router } from 'express'
import { pool } from '../db/client.js'
import { recomputeConsumptionSnapshots } from '../services/analyticsService.js'

export const analyticsRouter = Router()

analyticsRouter.post('/refresh', async (_, res) => {
  const result = await recomputeConsumptionSnapshots()
  return res.json({
    message: 'Consumption snapshots refreshed',
    ...result,
  })
})

analyticsRouter.get('/consumption', async (_, res) => {
  const result = await pool.query(
    `
    SELECT
      d.id AS drug_id,
      d.brand_name,
      cs.snapshot_date,
      cs.sold_units_30d,
      cs.avg_weekly_consumption,
      cs.amc,
      cs.months_of_stock_remaining
    FROM consumption_snapshots cs
    INNER JOIN drugs d ON d.id = cs.drug_id
    WHERE cs.snapshot_date = CURRENT_DATE
    ORDER BY d.brand_name ASC;
    `,
  )

  return res.json({
    data: result.rows,
  })
})
