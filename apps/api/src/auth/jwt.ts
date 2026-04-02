import jwt from 'jsonwebtoken'
import { env } from '../config.js'
import type { AuthUser } from '../types.js'

export interface AuthTokenPayload {
  sub: string
  email: string
  role: AuthUser['role']
}

export function signAccessToken(user: AuthUser) {
  const payload: AuthTokenPayload = {
    sub: String(user.id),
    email: user.email,
    role: user.role,
  }

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload
}
