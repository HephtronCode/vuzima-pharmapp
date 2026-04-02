import { pool } from '../db/client.js'

interface NotificationInput {
  userId: number | null
  type: string
  payload: Record<string, unknown>
  channel?: 'in_app' | 'email' | 'sms'
}

export async function createNotification(input: NotificationInput) {
  await pool.query(
    `
    INSERT INTO notifications (user_id, channel, type, payload, status)
    VALUES ($1, $2, $3, $4::jsonb, 'pending');
    `,
    [input.userId, input.channel ?? 'in_app', input.type, JSON.stringify(input.payload)],
  )
}
