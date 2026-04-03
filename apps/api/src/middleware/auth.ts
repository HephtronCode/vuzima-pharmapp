import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../auth/jwt.js'
import type { AppRole } from '../types.js'

function unauthorized(res: Response) {
  return res.status(401).json({
    message: 'Unauthorized',
  })
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const headerToken = header && header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  const cookieHeader = req.headers.cookie ?? ''
  const cookieToken = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('vuzima_access_token='))
    ?.slice('vuzima_access_token='.length)

  const token = headerToken ?? cookieToken
  if (!token) {
    return unauthorized(res)
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    }
    next()
  } catch {
    return unauthorized(res)
  }
}

export function requireRole(roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return unauthorized(res)
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Forbidden',
      })
    }

    next()
  }
}
