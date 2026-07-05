import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function checkRateLimit(
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
    logger.error("Rate limit check failed, allowing request", { error: e instanceof Error ? e.message : String(e) })
    return { allowed: true, remaining: maxRequests - 1 }
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  try {
    await db.rateLimit.delete({ where: { key } })
  } catch {
    // ignore
  }
}

export async function cleanupExpiredRateLimits(): Promise<number> {
  try {
    const result = await db.rateLimit.deleteMany({
      where: { resetAt: { lt: new Date() } },
    })
    return result.count
  } catch {
    return 0
  }
}
