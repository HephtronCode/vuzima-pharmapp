import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import type { NextFunction, Request, Response } from 'express'
import { env } from './config.js'
import { requireAuth, requireRole } from './middleware/auth.js'
import { analyticsRouter } from './routes/analytics.js'
import { alertsRouter } from './routes/alerts.js'
import { auditsRouter } from './routes/audits.js'
import { authRouter } from './routes/auth.js'
import { dashboardRouter } from './routes/dashboard.js'
import { drugsRouter } from './routes/drugs.js'
import { forecastRouter } from './routes/forecast.js'
import { healthRouter } from './routes/health.js'
import { inventoryRouter } from './routes/inventory.js'
import { jobsRouter } from './routes/jobs.js'
import { mockRouter } from './routes/mock.js'
import { reorderRouter } from './routes/reorder.js'
import { reportsRouter } from './routes/reports.js'
import { suppliersRouter } from './routes/suppliers.js'
import { usersRouter } from './routes/users.js'

export const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
)
app.use(express.json())
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.use('/api/health', healthRouter)
app.use('/api/mock', mockRouter)
app.use('/api/auth', authRouter)
app.use('/api/suppliers', requireAuth, suppliersRouter)
app.use('/api/drugs', requireAuth, requireRole(['admin']), drugsRouter)
app.use('/api/inventory', requireAuth, requireRole(['admin', 'staff']), inventoryRouter)
app.use('/api/dashboard', requireAuth, requireRole(['admin']), dashboardRouter)
app.use('/api/alerts', requireAuth, requireRole(['admin', 'staff']), alertsRouter)
app.use('/api/reorder', requireAuth, requireRole(['admin', 'staff']), reorderRouter)
app.use('/api/analytics', requireAuth, requireRole(['admin', 'staff']), analyticsRouter)
app.use('/api/audits', requireAuth, requireRole(['admin', 'staff']), auditsRouter)
app.use('/api/forecast', requireAuth, requireRole(['admin']), forecastRouter)
app.use('/api/reports', requireAuth, requireRole(['admin']), reportsRouter)
app.use('/api/jobs', requireAuth, requireRole(['admin']), jobsRouter)
app.use('/api/users', requireAuth, requireRole(['admin']), usersRouter)

app.use((_, res) => {
  res.status(404).json({
    message: 'Route not found',
  })
})

app.use((error: Error, _: Request, res: Response, __: NextFunction) => {
  console.error(error)
  res.status(500).json({
    message: 'Internal server error',
  })
})
