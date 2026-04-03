import bcrypt from 'bcryptjs'
import type { Request } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { signAccessToken } from '../auth/jwt.js'
import { env } from '../config.js'
import { pool } from '../db/client.js'
import { clearCsrfCookie, generateCsrfToken, setCsrfCookie } from '../middleware/csrf.js'
import { loginRateLimiter } from '../services/loginRateLimiter.js'
import type { AuthUser } from '../types.js'

const ACCESS_TOKEN_COOKIE = 'vuzima_access_token'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

function getIpKey(req: Request) {
  return req.ip || req.socket.remoteAddress || 'unknown_ip'
}

function getEmailKey(email: string) {
  return email.toLowerCase()
}

interface UserRow {
  id: number
  email: string
  role: AuthUser['role']
  password_hash: string
  is_active: boolean
}

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  const { email, password } = parsed.data
  const ipKey = getIpKey(req)
  const emailKey = getEmailKey(email)

  if (await loginRateLimiter.isBlocked(ipKey, emailKey)) {
    return res.status(429).json({ message: 'Too many login attempts. Try again later.' })
  }

  const result = await pool.query<UserRow>(
    'SELECT id, email, role, password_hash, is_active FROM users WHERE email = $1 LIMIT 1',
    [email],
  )

  const user = result.rows[0]
  if (!user) {
    await loginRateLimiter.registerFailure(ipKey, emailKey)
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  if (!user.is_active) {
    await loginRateLimiter.registerFailure(ipKey, emailKey)
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const validPassword = await bcrypt.compare(password, user.password_hash)
  if (!validPassword) {
    await loginRateLimiter.registerFailure(ipKey, emailKey)
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  await loginRateLimiter.clearEmailFailures(emailKey)

  const safeUser: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
  }
  const token = signAccessToken(safeUser)
  const csrfToken = generateCsrfToken()

  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  })
  setCsrfCookie(res, csrfToken)

  return res.json({
    user: safeUser,
    csrfToken,
  })
})

authRouter.post('/logout', (_, res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  })
  clearCsrfCookie(res)
  return res.json({ message: 'Logged out' })
})
