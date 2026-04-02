import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pool } from '../db/client.js'

const exportDir = path.resolve(process.cwd(), 'apps', 'api', 'exports')

function csvEscape(value: unknown) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`
  }
  return str
}

function toCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const headerLine = headers.join(',')
  const body = rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(','))
    .join('\n')
  return `${headerLine}\n${body}`
}

export async function processPendingReportExports() {
  const client = await pool.connect()
  try {
    const pending = await client.query<{
      id: number
      report_type: 'expiring_stock_value' | 'monthly_consumption' | 'inventory_snapshot'
      format: 'csv' | 'pdf' | 'excel'
    }>(
      `
      SELECT id, report_type, format
      FROM report_exports
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 20;
      `,
    )

    await mkdir(exportDir, { recursive: true })
    let processed = 0

    for (const job of pending.rows) {
      await client.query(
        `
        UPDATE report_exports
        SET status = 'processing'
        WHERE id = $1;
        `,
        [job.id],
      )

      try {
        let headers: string[] = []
        let dataRows: Array<Record<string, unknown>> = []

        if (job.report_type === 'expiring_stock_value') {
          const result = await client.query(
            `
            SELECT
              d.brand_name,
              ii.batch_number,
              ii.expiry_date,
              ii.quantity_on_hand,
              (ii.quantity_on_hand * d.cost_price)::NUMERIC(10,2) AS stock_value
            FROM inventory_items ii
            INNER JOIN drugs d ON d.id = ii.drug_id
            WHERE ii.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
            ORDER BY ii.expiry_date ASC;
            `,
          )
          headers = ['brand_name', 'batch_number', 'expiry_date', 'quantity_on_hand', 'stock_value']
          dataRows = result.rows
        }

        if (job.report_type === 'monthly_consumption') {
          const result = await client.query(
            `
            SELECT
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
          headers = [
            'brand_name',
            'snapshot_date',
            'sold_units_30d',
            'avg_weekly_consumption',
            'amc',
            'months_of_stock_remaining',
          ]
          dataRows = result.rows
        }

        if (job.report_type === 'inventory_snapshot') {
          const result = await client.query(
            `
            SELECT
              d.brand_name,
              ii.batch_number,
              ii.expiry_date,
              ii.quantity_on_hand,
              d.reorder_level
            FROM inventory_items ii
            INNER JOIN drugs d ON d.id = ii.drug_id
            ORDER BY d.brand_name ASC;
            `,
          )
          headers = ['brand_name', 'batch_number', 'expiry_date', 'quantity_on_hand', 'reorder_level']
          dataRows = result.rows
        }

        const fileName = `report_${job.id}_${job.report_type}.csv`
        const outputPath = path.join(exportDir, fileName)
        const csv = toCsv(headers, dataRows)
        await writeFile(outputPath, csv, 'utf8')

        await client.query(
          `
          UPDATE report_exports
          SET status = 'ready',
              file_path = $1,
              completed_at = NOW(),
              error_message = NULL
          WHERE id = $2;
          `,
          [outputPath, job.id],
        )

        processed += 1
      } catch (error) {
        await client.query(
          `
          UPDATE report_exports
          SET status = 'failed',
              error_message = $1,
              completed_at = NOW()
          WHERE id = $2;
          `,
          [error instanceof Error ? error.message : 'Unknown error', job.id],
        )
      }
    }

    return { processed }
  } finally {
    client.release()
  }
}
