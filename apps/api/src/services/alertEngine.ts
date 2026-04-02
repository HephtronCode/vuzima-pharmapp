import { pool } from '../db/client.js'
import { createNotification } from './notificationService.js'

type AlertTier = 'expired' | 'critical_7d' | 'warning_30d' | 'info_90d'

function toUtcMidnight(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
}

function determineTier(daysToExpiry: number): AlertTier | null {
  if (daysToExpiry < 0) {
    return 'expired'
  }
  if (daysToExpiry <= 7) {
    return 'critical_7d'
  }
  if (daysToExpiry <= 30) {
    return 'warning_30d'
  }
  if (daysToExpiry <= 90) {
    return 'info_90d'
  }
  return null
}

export async function runExpiryAlertScan() {
  const client = await pool.connect()
  let created = 0
  try {
    const inventoryRows = await client.query<{
      id: number
      expiry_date: string
    }>(
      `
      SELECT id, expiry_date
      FROM inventory_items;
      `,
    )

    for (const row of inventoryRows.rows) {
      const expiry = new Date(`${row.expiry_date}T00:00:00Z`)
      const today = new Date()
      const oneDayMs = 24 * 60 * 60 * 1000
      const daysToExpiry = Math.floor((toUtcMidnight(expiry) - toUtcMidnight(today)) / oneDayMs)
      const tier = determineTier(daysToExpiry)
      if (!tier) {
        continue
      }

      const inserted = await client.query(
        `
        INSERT INTO expiry_alerts (inventory_item_id, alert_tier, days_to_expiry, status, last_triggered_at)
        VALUES ($1, $2, $3, 'open', NOW())
        ON CONFLICT (inventory_item_id, alert_tier) WHERE (status = 'open') DO NOTHING
        RETURNING id;
        `,
        [row.id, tier, daysToExpiry],
      )

      if (inserted.rowCount && inserted.rowCount > 0) {
        created += 1
        await createNotification({
          userId: null,
          type: 'expiry_alert_created',
          payload: {
            inventory_item_id: row.id,
            alert_tier: tier,
            days_to_expiry: daysToExpiry,
          },
        })
      }

      await client.query(
        `
        UPDATE expiry_alerts
        SET days_to_expiry = $1,
            last_triggered_at = NOW()
        WHERE inventory_item_id = $2
          AND alert_tier = $3
          AND status = 'open';
        `,
        [daysToExpiry, row.id, tier],
      )
    }

    return { created }
  } finally {
    client.release()
  }
}
