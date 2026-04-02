import { Router } from 'express'
import { pool } from '../db/client.js'
import { runForecastModel } from '../services/forecastService.js'

export const forecastRouter = Router()

forecastRouter.post('/run', async (_, res) => {
  const result = await runForecastModel()
  return res.json({
    message: 'Forecast run complete',
    ...result,
  })
})

forecastRouter.get('/latest', async (_, res) => {
  const latestRun = await pool.query<{ id: number; status: string; completed_at: string }>(
    `
    SELECT id, status, completed_at
    FROM forecast_runs
    ORDER BY created_at DESC
    LIMIT 1;
    `,
  )

  if (latestRun.rowCount === 0) {
    return res.json({
      run: null,
      forecasts: [],
      anomalies: [],
    })
  }

  const runId = latestRun.rows[0].id
  const forecastRows = await pool.query(
    `
    SELECT
      fo.id,
      fo.signal_type,
      fo.predicted_units_30d,
      fo.baseline_units_30d,
      fo.change_percent,
      fo.confidence_score,
      fo.message,
      d.brand_name
    FROM forecast_outputs fo
    INNER JOIN drugs d ON d.id = fo.drug_id
    WHERE fo.run_id = $1
      AND fo.signal_type = 'forecast'
    ORDER BY fo.predicted_units_30d DESC NULLS LAST;
    `,
    [runId],
  )

  const anomalyRows = await pool.query(
    `
    SELECT
      fo.id,
      fo.signal_type,
      fo.change_percent,
      fo.message,
      d.brand_name
    FROM forecast_outputs fo
    INNER JOIN drugs d ON d.id = fo.drug_id
    WHERE fo.run_id = $1
      AND fo.signal_type IN ('spike', 'drop', 'dead_stock')
    ORDER BY fo.created_at DESC;
    `,
    [runId],
  )

  return res.json({
    run: latestRun.rows[0],
    forecasts: forecastRows.rows,
    anomalies: anomalyRows.rows,
  })
})
