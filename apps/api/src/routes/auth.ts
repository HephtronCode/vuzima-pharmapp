import bcrypt from 'bcryptjs'
import type { Request } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { signAccessToken } from '../auth/jwt.js'
import { pool } from '../db/client.js'
import type { AuthUser } from '../types.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_LOCK_MS = 15 * 60 * 1000

interface LoginAttemptState {
  count: number
  firstFailedAt: number
  lockedUntil: number
}

const loginAttemptsByIp = new Map<string, LoginAttemptState>()
const loginAttemptsByEmail = new Map<string, LoginAttemptState>()

function getIpKey(req: Request) {
  return req.ip || req.socket.remoteAddress || 'unknown_ip'
}

function getEmailKey(email: string) {
  return email.toLowerCase()
}

function getActiveState(map: Map<string, LoginAttemptState>, key: string) {
  const state = map.get(key)
  if (!state) return null
  if (state.lockedUntil > Date.now()) return state
  if (Date.now() - state.firstFailedAt > LOGIN_LOCK_MS) {
    map.delete(key)
    return null
  }
  return state
}

function isLocked(map: Map<string, LoginAttemptState>, key: string) {
  const state = getActiveState(map, key)
  return Boolean(state && state.lockedUntil > Date.now())
}

function registerFailure(map: Map<string, LoginAttemptState>, key: string) {
  const now = Date.now()
  const current = getActiveState(map, key)
  if (!current) {
    map.set(key, {
      count: 1,
      firstFailedAt: now,
      lockedUntil: 0,
    })
    return
  }

  const nextCount = current.count + 1
  map.set(key, {
    count: nextCount,
    firstFailedAt: current.firstFailedAt,
    lockedUntil: nextCount >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_LOCK_MS : 0,
  })
}

function clearFailures(map: Map<string, LoginAttemptState>, key: string) {
  map.delete(key)
}

function denyInvalidCredentials(req: Request, email: string) {
  const ipKey = getIpKey(req)
  const emailKey = getEmailKey(email)
  registerFailure(loginAttemptsByIp, ipKey)
  registerFailure(loginAttemptsByEmail, emailKey)
  return { message: 'Invalid credentials' }
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

  if (isLocked(loginAttemptsByIp, ipKey) || isLocked(loginAttemptsByEmail, emailKey)) {
    return res.status(429).json({ message: 'Too many login attempts. Try again later.' })
  }

  const result = await pool.query<UserRow>(
    'SELECT id, email, role, password_hash, is_active FROM users WHERE email = $1 LIMIT 1',
    [email],
  )

  const user = result.rows[0]
  if (!user) {
    return res.status(401).json(denyInvalidCredentials(req, email))
  }

  if (!user.is_active) {
    return res.status(401).json(denyInvalidCredentials(req, email))
  }

  const validPassword = await bcrypt.compare(password, user.password_hash)
  if (!validPassword) {
    return res.status(401).json(denyInvalidCredentials(req, email))
  }

  clearFailures(loginAttemptsByIp, ipKey)
  clearFailures(loginAttemptsByEmail, emailKey)

  const safeUser: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
  }
  const token = signAccessToken(safeUser)

  return res.json({
    token,
    user: safeUser,
  })
})
