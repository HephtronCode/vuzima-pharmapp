import { Redis } from 'ioredis'
import { env } from '../config.js'

const MAX_LOGIN_ATTEMPTS = 5
const WINDOW_SECONDS = 15 * 60

type FailureState = {
  locked: boolean
}

type LoginRateLimiter = {
  isBlocked: (ip: string, email: string) => Promise<boolean>
  registerFailure: (ip: string, email: string) => Promise<FailureState>
  clearEmailFailures: (email: string) => Promise<void>
}

function keyForIp(ip: string) {
  return `login:fail:ip:${ip}`
}

function keyForEmail(email: string) {
  return `login:fail:email:${email.toLowerCase()}`
}

function createRedisLimiter(redisUrl: string): LoginRateLimiter {
  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  })

  async function readFailures(key: string) {
    const raw = await redis.get(key)
    return Number(raw ?? 0)
  }

  async function incrementFailure(key: string) {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS)
    }
    return count
  }

  return {
    async isBlocked(ip, email) {
      const [ipFailures, emailFailures] = await Promise.all([
        readFailures(keyForIp(ip)),
        readFailures(keyForEmail(email)),
      ])
      return ipFailures >= MAX_LOGIN_ATTEMPTS || emailFailures >= MAX_LOGIN_ATTEMPTS
    },
    async registerFailure(ip, email) {
      const [ipFailures, emailFailures] = await Promise.all([
        incrementFailure(keyForIp(ip)),
        incrementFailure(keyForEmail(email)),
      ])
      return { locked: ipFailures >= MAX_LOGIN_ATTEMPTS || emailFailures >= MAX_LOGIN_ATTEMPTS }
    },
    async clearEmailFailures(email) {
      await redis.del(keyForEmail(email))
    },
  }
}

function createMemoryLimiter(): LoginRateLimiter {
  type State = { count: number; firstFailedAt: number; lockedUntil: number }
  const byIp = new Map<string, State>()
  const byEmail = new Map<string, State>()

  function getActive(map: Map<string, State>, key: string) {
    const state = map.get(key)
    if (!state) return null
    const now = Date.now()
    if (state.lockedUntil > now) return state
    if (now - state.firstFailedAt > WINDOW_SECONDS * 1000) {
      map.delete(key)
      return null
    }
    return state
  }

  function register(map: Map<string, State>, key: string) {
    const now = Date.now()
    const current = getActive(map, key)
    if (!current) {
      map.set(key, { count: 1, firstFailedAt: now, lockedUntil: 0 })
      return 1
    }
    const next = current.count + 1
    map.set(key, {
      count: next,
      firstFailedAt: current.firstFailedAt,
      lockedUntil: next >= MAX_LOGIN_ATTEMPTS ? now + WINDOW_SECONDS * 1000 : 0,
    })
    return next
  }

  function blocked(map: Map<string, State>, key: string) {
    const state = getActive(map, key)
    return Boolean(state && state.lockedUntil > Date.now())
  }

  return {
    async isBlocked(ip, email) {
      return blocked(byIp, ip) || blocked(byEmail, email.toLowerCase())
    },
    async registerFailure(ip, email) {
      const ipCount = register(byIp, ip)
      const emailCount = register(byEmail, email.toLowerCase())
      return { locked: ipCount >= MAX_LOGIN_ATTEMPTS || emailCount >= MAX_LOGIN_ATTEMPTS }
    },
    async clearEmailFailures(email) {
      byEmail.delete(email.toLowerCase())
    },
  }
}

export const loginRateLimiter: LoginRateLimiter = env.REDIS_URL
  ? (() => {
      const memoryLimiter = createMemoryLimiter()
      const redisLimiter = createRedisLimiter(env.REDIS_URL as string)

      return {
        async isBlocked(ip, email) {
          try {
            return await redisLimiter.isBlocked(ip, email)
          } catch (error) {
            console.warn('Redis limiter unavailable, falling back to memory limiter', error)
            return memoryLimiter.isBlocked(ip, email)
          }
        },
        async registerFailure(ip, email) {
          try {
            return await redisLimiter.registerFailure(ip, email)
          } catch (error) {
            console.warn('Redis limiter unavailable, falling back to memory limiter', error)
            return memoryLimiter.registerFailure(ip, email)
          }
        },
        async clearEmailFailures(email) {
          try {
            await redisLimiter.clearEmailFailures(email)
          } catch (error) {
            console.warn('Redis limiter unavailable, falling back to memory limiter', error)
            await memoryLimiter.clearEmailFailures(email)
          }
        },
      }
    })()
  : createMemoryLimiter()
