import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/vuzima'),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().min(12).default('dev-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('1d'),
})

const parsed = envSchema.parse(process.env)

if (parsed.NODE_ENV === 'production' && parsed.JWT_SECRET === 'dev-secret-change-me') {
  throw new Error('JWT_SECRET must be explicitly set in production and cannot use development default')
}

if (parsed.NODE_ENV === 'production' && parsed.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production')
}

export const env = parsed
