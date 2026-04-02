import { Router } from 'express'
import { pool } from '../db/client.js'

export const dashboardRouter = Router()

dashboardRouter.get('/summary', async (_, res) => {
  const totalStockValueResult = await pool.query<{ total: string }>(
    `
    SELECT COALESCE(SUM(ii.quantity_on_hand * d.cost_price), 0)::TEXT AS total
    FROM inventory_items ii
    INNER JOIN drugs d ON d.id = ii.drug_id;
    `,
  )

  const expiringValue30dResult = await pool.query<{ total: string }>(
    `
    SELECT COALESCE(SUM(ii.quantity_on_hand * d.cost_price), 0)::TEXT AS total
    FROM inventory_items ii
    INNER JOIN drugs d ON d.id = ii.drug_id
    WHERE ii.expiry_date <= CURRENT_DATE + INTERVAL '30 days';
    `,
  )

  const lowStockResult = await pool.query<{ count: string }>(
    `
    SELECT COUNT(*)::TEXT AS count
    FROM inventory_items ii
    INNER JOIN drugs d ON d.id = ii.drug_id
    WHERE ii.quantity_on_hand < d.reorder_level;
    `,
  )

  const criticalAlertCountResult = await pool.query<{ count: string }>(
    `
    SELECT COUNT(*)::TEXT AS count
    FROM expiry_alerts
    WHERE status = 'open'
      AND alert_tier IN ('expired', 'critical_7d');
    `,
  )

  const latestForecastSignalsResult = await pool.query<{ count: string }>(
    `
    SELECT COUNT(*)::TEXT AS count
    FROM forecast_outputs fo
    INNER JOIN (
      SELECT id FROM forecast_runs ORDER BY created_at DESC LIMIT 1
    ) latest_run ON latest_run.id = fo.run_id
    WHERE fo.signal_type IN ('spike', 'drop', 'dead_stock');
    `,
  )

  const forecastHighlightsResult = await pool.query<{ message: string }>(
    `
    SELECT fo.message
    FROM forecast_outputs fo
    INNER JOIN (
      SELECT id FROM forecast_runs ORDER BY created_at DESC LIMIT 1
    ) latest_run ON latest_run.id = fo.run_id
    WHERE fo.signal_type = 'forecast'
    ORDER BY fo.predicted_units_30d DESC NULLS LAST
    LIMIT 2;
    `,
  )

  return res.json({
    totalStockValue: Number(totalStockValueResult.rows[0]?.total ?? 0),
    expiringValue30d: Number(expiringValue30dResult.rows[0]?.total ?? 0),
    lowStockSkus: Number(lowStockResult.rows[0]?.count ?? 0),
    criticalAlerts: Number(criticalAlertCountResult.rows[0]?.count ?? 0),
    forecastSignals: Number(latestForecastSignalsResult.rows[0]?.count ?? 0),
    ownerMargin: 24.1,
    forecastHighlights:
      forecastHighlightsResult.rowCount && forecastHighlightsResult.rowCount > 0
        ? forecastHighlightsResult.rows.map((row) => row.message)
        : [
            'Forecast model not run yet. Trigger forecast from jobs endpoint.',
          ],
  })
})
