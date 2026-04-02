import { Router } from 'express'
import { recomputeConsumptionSnapshots } from '../services/analyticsService.js'
import { runExpiryAlertScan } from '../services/alertEngine.js'
import { runForecastModel } from '../services/forecastService.js'
import { processPendingReportExports } from '../services/reportService.js'

export const jobsRouter = Router()

jobsRouter.post('/run-expiry-scan', async (_, res) => {
  const result = await runExpiryAlertScan()
  return res.json({
    message: 'Expiry scan complete',
    ...result,
  })
})

jobsRouter.post('/run-analytics-refresh', async (_, res) => {
  const result = await recomputeConsumptionSnapshots()
  return res.json({
    message: 'Analytics refresh complete',
    ...result,
  })
})

jobsRouter.post('/run-report-processor', async (_, res) => {
  const result = await processPendingReportExports()
  return res.json({
    message: 'Report processor complete',
    ...result,
  })
})

jobsRouter.post('/run-forecast', async (_, res) => {
  const result = await runForecastModel()
  return res.json({
    message: 'Forecast run complete',
    ...result,
  })
})
