import pg from 'pg'
import { env } from '../config.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.PGSSL
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
})
