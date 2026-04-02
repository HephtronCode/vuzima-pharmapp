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
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res)
  }

  const token = header.slice('Bearer '.length)
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
