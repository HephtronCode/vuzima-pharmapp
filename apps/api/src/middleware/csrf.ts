import { randomBytes } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config.js'

export const CSRF_COOKIE_NAME = 'vuzima_csrf_token'
export const CSRF_HEADER_NAME = 'x-csrf-token'

function getCookieValue(req: Request, name: string) {
  const cookieHeader = req.headers.cookie ?? ''
  const encodedName = `${name}=`
  const part = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(encodedName))

  if (!part) return null
  return decodeURIComponent(part.slice(encodedName.length))
}

export function generateCsrfToken() {
  return randomBytes(32).toString('hex')
}

export function setCsrfCookie(res: Response, token: string) {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  })
}

export function clearCsrfCookie(res: Response) {
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  })
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next()
    return
  }

  const cookieToken = getCookieValue(req, CSRF_COOKIE_NAME)
  const headerToken = req.headers[CSRF_HEADER_NAME]
  const normalizedHeader = Array.isArray(headerToken) ? headerToken[0] : headerToken

  if (!cookieToken || !normalizedHeader || cookieToken !== normalizedHeader) {
    res.status(403).json({ message: 'Invalid CSRF token' })
    return
  }

  next()
}
