import { pool } from '../db/client.js'

interface FastMoverRow {
  drug_id: number
  brand_name: string
  sold_units_30d: string
  sold_units_prev_30d: string
  sold_units_60d: string
  avg_daily_last_7d: string
  avg_daily_last_30d: string
}

function safePercentChange(current: number, baseline: number) {
  if (baseline <= 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - baseline) / baseline) * 100
}

function confidenceByVolume(units30d: number) {
  if (units30d >= 1200) return 0.9
  if (units30d >= 600) return 0.82
  if (units30d >= 250) return 0.74
  if (units30d >= 100) return 0.66
  return 0.58
}

export async function runForecastModel() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const runInsert = await client.query<{ id: number }>(
      `
      INSERT INTO forecast_runs (status, started_at)
      VALUES ('processing', NOW())
      RETURNING id;
      `,
    )
    const runId = runInsert.rows[0].id

    const movers = await client.query<FastMoverRow>(
      `
      WITH movement_agg AS (
        SELECT
          ii.drug_id,
          COALESCE(SUM(CASE WHEN sm.quantity_changed < 0 AND sm.created_at >= NOW() - INTERVAL '30 days' THEN -sm.quantity_changed ELSE 0 END), 0)::NUMERIC AS sold_units_30d,
          COALESCE(SUM(CASE WHEN sm.quantity_changed < 0 AND sm.created_at >= NOW() - INTERVAL '60 days' AND sm.created_at < NOW() - INTERVAL '30 days' THEN -sm.quantity_changed ELSE 0 END), 0)::NUMERIC AS sold_units_prev_30d,
          COALESCE(SUM(CASE WHEN sm.quantity_changed < 0 AND sm.created_at >= NOW() - INTERVAL '60 days' THEN -sm.quantity_changed ELSE 0 END), 0)::NUMERIC AS sold_units_60d,
          COALESCE(SUM(CASE WHEN sm.quantity_changed < 0 AND sm.created_at >= NOW() - INTERVAL '7 days' THEN -sm.quantity_changed ELSE 0 END), 0)::NUMERIC / 7 AS avg_daily_last_7d,
          COALESCE(SUM(CASE WHEN sm.quantity_changed < 0 AND sm.created_at >= NOW() - INTERVAL '30 days' THEN -sm.quantity_changed ELSE 0 END), 0)::NUMERIC / 30 AS avg_daily_last_30d
        FROM inventory_items ii
        LEFT JOIN stock_movements sm ON sm.inventory_item_id = ii.id
        GROUP BY ii.drug_id
      )
      SELECT
        d.id AS drug_id,
        d.brand_name,
        ma.sold_units_30d::TEXT,
        ma.sold_units_prev_30d::TEXT,
        ma.sold_units_60d::TEXT,
        ma.avg_daily_last_7d::TEXT,
        ma.avg_daily_last_30d::TEXT
      FROM drugs d
      INNER JOIN movement_agg ma ON ma.drug_id = d.id
      ORDER BY ma.sold_units_30d DESC
      LIMIT 20;
      `,
    )

    for (const row of movers.rows) {
      const sold30 = Number(row.sold_units_30d)
      const prev30 = Number(row.sold_units_prev_30d)
      const avg7 = Number(row.avg_daily_last_7d)
      const avg30 = Number(row.avg_daily_last_30d)

      const weightedDaily = avg7 * 0.6 + avg30 * 0.4
      const forecastUnits30 = weightedDaily * 30
      const changePct = safePercentChange(forecastUnits30, sold30)
      const confidence = confidenceByVolume(sold30)

      await client.query(
        `
        INSERT INTO forecast_outputs (
          run_id,
          drug_id,
          signal_type,
          predicted_units_30d,
          baseline_units_30d,
          change_percent,
          confidence_score,
          message,
          metadata
        )
        VALUES ($1, $2, 'forecast', $3, $4, $5, $6, $7, $8::jsonb);
        `,
        [
          runId,
          row.drug_id,
          forecastUnits30.toFixed(2),
          sold30.toFixed(2),
          changePct.toFixed(2),
          confidence.toFixed(2),
          `Predicted demand for ${row.brand_name} in next 30 days: ${Math.round(forecastUnits30)} units (${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}% vs last 30d).`,
          JSON.stringify({
            avg_daily_last_7d: avg7,
            avg_daily_last_30d: avg30,
            sold_prev_30d: prev30,
          }),
        ],
      )

      if (prev30 > 0 && sold30 > prev30 * 2) {
        await client.query(
          `
          INSERT INTO forecast_outputs (
            run_id,
            drug_id,
            signal_type,
            predicted_units_30d,
            baseline_units_30d,
            change_percent,
            confidence_score,
            message,
            metadata
          )
          VALUES ($1, $2, 'spike', $3, $4, $5, $6, $7, $8::jsonb);
          `,
          [
            runId,
            row.drug_id,
            sold30.toFixed(2),
            prev30.toFixed(2),
            safePercentChange(sold30, prev30).toFixed(2),
            confidence.toFixed(2),
            `Unusual Spike: ${row.brand_name} sales are significantly above prior 30-day baseline.`,
            JSON.stringify({ sold_30d: sold30, sold_prev_30d: prev30 }),
          ],
        )
      }

      if (prev30 > 0 && sold30 < prev30 * 0.4) {
        await client.query(
          `
          INSERT INTO forecast_outputs (
            run_id,
            drug_id,
            signal_type,
            predicted_units_30d,
            baseline_units_30d,
            change_percent,
            confidence_score,
            message,
            metadata
          )
          VALUES ($1, $2, 'drop', $3, $4, $5, $6, $7, $8::jsonb);
          `,
          [
            runId,
            row.drug_id,
            sold30.toFixed(2),
            prev30.toFixed(2),
            safePercentChange(sold30, prev30).toFixed(2),
            confidence.toFixed(2),
            `Demand Drop: ${row.brand_name} sales are materially below prior 30-day baseline.`,
            JSON.stringify({ sold_30d: sold30, sold_prev_30d: prev30 }),
          ],
        )
      }

      if (sold30 === 0) {
        await client.query(
          `
          INSERT INTO forecast_outputs (
            run_id,
            drug_id,
            signal_type,
            predicted_units_30d,
            baseline_units_30d,
            change_percent,
            confidence_score,
            message,
            metadata
          )
          VALUES ($1, $2, 'dead_stock', $3, $4, $5, $6, $7, $8::jsonb);
          `,
          [
            runId,
            row.drug_id,
            0,
            prev30.toFixed(2),
            -100,
            0.72,
            `Dead Stock Alert: ${row.brand_name} has zero sales in the last 30 days.`,
            JSON.stringify({ sold_30d: sold30, sold_prev_30d: prev30 }),
          ],
        )
      }
    }

    await client.query(
      `
      UPDATE forecast_runs
      SET status = 'completed',
          completed_at = NOW()
      WHERE id = $1;
      `,
      [runId],
    )

    await client.query('COMMIT')
    return { runId, processed: movers.rows.length }
  } catch (error) {
    await client.query('ROLLBACK')

    const message = error instanceof Error ? error.message : 'Unknown forecast error'
    await client.query(
      `
      INSERT INTO forecast_runs (status, error_message, completed_at)
      VALUES ('failed', $1, NOW());
      `,
      [message],
    )

    throw error
  } finally {
    client.release()
  }
}
