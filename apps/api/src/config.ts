import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/vuzima'),
  JWT_SECRET: z.string().min(12).default('dev-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('1d'),
})

export const env = envSchema.parse(process.env)
