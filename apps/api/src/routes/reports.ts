import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/client.js'
import { processPendingReportExports } from '../services/reportService.js'

const createExportSchema = z.object({
  report_type: z.enum(['expiring_stock_value', 'monthly_consumption', 'inventory_snapshot']),
  format: z.enum(['csv', 'pdf', 'excel']).default('csv'),
  params: z.record(z.string(), z.any()).optional(),
})

export const reportsRouter = Router()

reportsRouter.post('/export', async (req, res) => {
  const parsed = createExportSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  const actorId = req.user?.id ?? null
  const payload = parsed.data
  const created = await pool.query<{
    id: number
    status: string
  }>(
    `
    INSERT INTO report_exports (requested_by, report_type, format, status, params)
    VALUES ($1, $2, $3, 'pending', $4::jsonb)
    RETURNING id, status;
    `,
    [actorId, payload.report_type, payload.format, JSON.stringify(payload.params ?? {})],
  )

  return res.status(202).json({
    message: 'Report export queued',
    data: created.rows[0],
  })
})

reportsRouter.post('/process', async (_, res) => {
  const result = await processPendingReportExports()
  return res.json({
    message: 'Report processor complete',
    ...result,
  })
})

reportsRouter.get('/', async (_, res) => {
  const result = await pool.query(
    `
    SELECT
      re.id,
      re.report_type,
      re.format,
      re.status,
      re.file_path,
      re.created_at,
      re.completed_at,
      u.email AS requested_by_email
    FROM report_exports re
    LEFT JOIN users u ON u.id = re.requested_by
    ORDER BY re.created_at DESC
    LIMIT 50;
    `,
  )

  return res.json({
    data: result.rows,
  })
})
