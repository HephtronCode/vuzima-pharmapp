import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { signAccessToken } from '../auth/jwt.js'
import { pool } from '../db/client.js'
import type { AuthUser } from '../types.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

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
  const result = await pool.query<UserRow>(
    'SELECT id, email, role, password_hash, is_active FROM users WHERE email = $1 LIMIT 1',
    [email],
  )

  const user = result.rows[0]
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  if (!user.is_active) {
    return res.status(403).json({ message: 'Account disabled. Contact admin.' })
  }

  const validPassword = await bcrypt.compare(password, user.password_hash)
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

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
