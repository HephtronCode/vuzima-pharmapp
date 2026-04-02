import { pool } from '../db/client.js'

export async function recomputeConsumptionSnapshots() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const rows = await client.query<{
      drug_id: number
      total_on_hand: string
      sold_units_30d: string
    }>(
      `
      WITH stock_totals AS (
        SELECT ii.drug_id, SUM(ii.quantity_on_hand)::NUMERIC AS total_on_hand
        FROM inventory_items ii
        GROUP BY ii.drug_id
      ),
      movement_usage AS (
        SELECT
          ii.drug_id,
          COALESCE(SUM(CASE WHEN sm.quantity_changed < 0 THEN -sm.quantity_changed ELSE 0 END), 0)::NUMERIC AS sold_units_30d
        FROM inventory_items ii
        LEFT JOIN stock_movements sm
          ON sm.inventory_item_id = ii.id
         AND sm.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY ii.drug_id
      )
      SELECT
        d.id AS drug_id,
        COALESCE(st.total_on_hand, 0)::TEXT AS total_on_hand,
        COALESCE(mu.sold_units_30d, 0)::TEXT AS sold_units_30d
      FROM drugs d
      LEFT JOIN stock_totals st ON st.drug_id = d.id
      LEFT JOIN movement_usage mu ON mu.drug_id = d.id;
      `,
    )

    for (const row of rows.rows) {
      const sold30 = Number(row.sold_units_30d)
      const onHand = Number(row.total_on_hand)
      const weekly = sold30 / 4
      const amc = sold30 / 1
      const monthsRemaining = amc > 0 ? onHand / amc : null

      await client.query(
        `
        INSERT INTO consumption_snapshots (
          drug_id,
          snapshot_date,
          sold_units_30d,
          avg_weekly_consumption,
          amc,
          months_of_stock_remaining
        )
        VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
        ON CONFLICT (drug_id, snapshot_date)
        DO UPDATE SET
          sold_units_30d = EXCLUDED.sold_units_30d,
          avg_weekly_consumption = EXCLUDED.avg_weekly_consumption,
          amc = EXCLUDED.amc,
          months_of_stock_remaining = EXCLUDED.months_of_stock_remaining;
        `,
        [row.drug_id, sold30, weekly.toFixed(2), amc.toFixed(2), monthsRemaining?.toFixed(2) ?? null],
      )
    }

    await client.query('COMMIT')
    return { updated: rows.rowCount ?? rows.rows.length }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
