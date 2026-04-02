import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/client.js'
import type { AuthUser } from '../types.js'

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

interface SafeUserRow {
  id: number
  email: string
  role: AuthUser['role']
  is_active: boolean
  created_at: string
}

const staffIdSchema = z.object({
  id: z.number().int().positive(),
})

const resetPasswordSchema = z.object({
  password: z.string().min(8),
})

export const usersRouter = Router()

usersRouter.get('/', async (_, res) => {
  const result = await pool.query<SafeUserRow>(
    `
    SELECT id, email, role, is_active, created_at
    FROM users
    WHERE role = 'staff'
    ORDER BY id DESC;
    `,
  )

  return res.json({ data: result.rows })
})

usersRouter.post('/staff', async (req, res) => {
  const parsed = createStaffSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: parsed.error.issues,
    })
  }

  const payload = parsed.data
  const passwordHash = await bcrypt.hash(payload.password, 10)

  try {
    const result = await pool.query<SafeUserRow>(
      `
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, 'staff')
      RETURNING id, email, role, is_active, created_at;
      `,
      [payload.email, passwordHash],
    )

    return res.status(201).json({
      message: 'Staff account created',
      data: result.rows[0],
    })
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    ) {
      return res.status(409).json({ message: 'Email already exists' })
    }
    throw error
  }
})

usersRouter.post('/staff/:id/reset-password', async (req, res) => {
  const idParsed = staffIdSchema.safeParse({ id: Number(req.params.id) })
  if (!idParsed.success) {
    return res.status(400).json({ message: 'Invalid staff id' })
  }

  const bodyParsed = resetPasswordSchema.safeParse(req.body)
  if (!bodyParsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: bodyParsed.error.issues,
    })
  }

  const passwordHash = await bcrypt.hash(bodyParsed.data.password, 10)
  const result = await pool.query<SafeUserRow>(
    `
    UPDATE users
    SET password_hash = $1,
        updated_at = NOW()
    WHERE id = $2 AND role = 'staff'
    RETURNING id, email, role, is_active, created_at;
    `,
    [passwordHash, idParsed.data.id],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Staff account not found' })
  }

  return res.json({
    message: 'Temporary password reset successfully',
    data: result.rows[0],
  })
})

usersRouter.post('/staff/:id/disable', async (req, res) => {
  const idParsed = staffIdSchema.safeParse({ id: Number(req.params.id) })
  if (!idParsed.success) {
    return res.status(400).json({ message: 'Invalid staff id' })
  }

  const result = await pool.query<SafeUserRow>(
    `
    UPDATE users
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE id = $1 AND role = 'staff'
    RETURNING id, email, role, is_active, created_at;
    `,
    [idParsed.data.id],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Staff account not found' })
  }

  return res.json({
    message: 'Staff account disabled',
    data: result.rows[0],
  })
})

usersRouter.post('/staff/:id/enable', async (req, res) => {
  const idParsed = staffIdSchema.safeParse({ id: Number(req.params.id) })
  if (!idParsed.success) {
    return res.status(400).json({ message: 'Invalid staff id' })
  }

  const result = await pool.query<SafeUserRow>(
    `
    UPDATE users
    SET is_active = TRUE,
        updated_at = NOW()
    WHERE id = $1 AND role = 'staff'
    RETURNING id, email, role, is_active, created_at;
    `,
    [idParsed.data.id],
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Staff account not found' })
  }

  return res.json({
    message: 'Staff account enabled',
    data: result.rows[0],
  })
})
