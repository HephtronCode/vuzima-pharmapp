import { Router } from 'express'
import { pool } from '../db/client.js'

export const reorderRouter = Router()

reorderRouter.get('/suggestions', async (_, res) => {
  const result = await pool.query(
    `
    WITH movement_usage AS (
      SELECT
        ii.drug_id,
        COALESCE(SUM(CASE WHEN sm.quantity_changed < 0 THEN -sm.quantity_changed ELSE 0 END), 0) AS sold_units_30d
      FROM inventory_items ii
      LEFT JOIN stock_movements sm
        ON sm.inventory_item_id = ii.id
       AND sm.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY ii.drug_id
    ),
    stock_totals AS (
      SELECT
        ii.drug_id,
        SUM(ii.quantity_on_hand) AS total_on_hand
      FROM inventory_items ii
      GROUP BY ii.drug_id
    )
    SELECT
      d.id AS drug_id,
      d.brand_name,
      d.generic_name,
      d.reorder_level,
      COALESCE(st.total_on_hand, 0) AS current_stock,
      COALESCE(mu.sold_units_30d / 30.0, 0)::NUMERIC(10,2) AS avg_daily_usage,
      COALESCE(drs.safety_stock, 0) AS safety_stock,
      COALESCE(drs.lead_time_override_days, s.lead_time_days, 7) AS lead_time_days,
      GREATEST(
        (
          (COALESCE(mu.sold_units_30d / 30.0, 0) * COALESCE(drs.lead_time_override_days, s.lead_time_days, 7))
          + COALESCE(drs.safety_stock, 0)
        )::INTEGER,
        d.reorder_level
      ) AS reorder_point
    FROM drugs d
    LEFT JOIN suppliers s ON s.id = d.supplier_id
    LEFT JOIN movement_usage mu ON mu.drug_id = d.id
    LEFT JOIN stock_totals st ON st.drug_id = d.id
    LEFT JOIN drug_reorder_settings drs ON drs.drug_id = d.id
    ORDER BY d.brand_name ASC;
    `,
  )

  const suggestions = result.rows
    .map((row) => {
      const reorderPoint = Number(row.reorder_point)
      const currentStock = Number(row.current_stock)
      const suggestedOrder = Math.max(reorderPoint - currentStock, 0)

      return {
        ...row,
        reorder_point: reorderPoint,
        current_stock: currentStock,
        suggested_order_qty: suggestedOrder,
        is_below_reorder_point: currentStock < reorderPoint,
      }
    })
    .sort((a, b) => Number(b.suggested_order_qty) - Number(a.suggested_order_qty))

  return res.json({ data: suggestions })
})
