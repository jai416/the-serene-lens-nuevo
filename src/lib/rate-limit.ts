import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { redisGet, redisSet, redisDel, isRedisConfigured } from "@/lib/redis"

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (isRedisConfigured()) {
    return checkRateLimitRedis(key, maxRequests, windowMs)
  }
  return checkRateLimitDb(key, maxRequests, windowMs)
}

async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const redisKey = `ratelimit:${key}`
    const current = await redisGet<number>(redisKey)
    if (current === undefined) {
      await redisSet(redisKey, 1, Math.ceil(windowMs / 1000))
      return { allowed: true, remaining: maxRequests - 1 }
    }
    if (current >= maxRequests) {
      return { allowed: false, remaining: 0 }
    }
    await redisSet(redisKey, current + 1, Math.ceil(windowMs / 1000))
    return { allowed: true, remaining: maxRequests - current - 1 }
  } catch (e) {
    logger.error("Redis rate limit failed, falling back to DB", { error: e instanceof Error ? e.message : String(e) })
    return checkRateLimitDb(key, maxRequests, windowMs)
  }
}

async function checkRateLimitDb(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)

  try {
    return await db.$transaction(async (tx: any) => {
      const current = await tx.rateLimit.findUnique({ where: { key } })

      if (!current || now > current.resetAt) {
        await tx.rateLimit.upsert({
          where: { key },
          create: { key, count: 1, resetAt },
          update: { count: 1, resetAt },
        })
        return { allowed: true, remaining: maxRequests - 1 }
      }

      if (current.count >= maxRequests) {
        return { allowed: false, remaining: 0 }
      }

      await tx.rateLimit.update({
        where: { key },
        data: { count: current.count + 1 },
      })

      return { allowed: true, remaining: maxRequests - current.count - 1 }
    })
  } catch (e) {
    logger.error("Rate limit DB check failed, allowing request", { error: e instanceof Error ? e.message : String(e) })
    return { allowed: true, remaining: maxRequests - 1 }
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  if (isRedisConfigured()) {
    try {
      await redisDel(`ratelimit:${key}`)
    } catch (e) { logger.error("Redis rate limit clear failed", { error: e }) }
  }
  try {
    await db.rateLimit.delete({ where: { key } })
  } catch (e) { logger.error("DB rate limit clear failed", { error: e }) }
}

export async function cleanupExpiredRateLimits(): Promise<number> {
  if (isRedisConfigured()) {
    // Redis keys auto-expire via TTL — no cleanup needed
    return 0
  }
  try {
    const result = await db.rateLimit.deleteMany({
      where: { resetAt: { lt: new Date() } },
    })
    return result.count
  } catch {
    return 0
  }
}
