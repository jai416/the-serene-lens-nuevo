import { db } from "@/lib/db"

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)

  try {
    const existing = await db.rateLimit.findUnique({ where: { key } })

    if (!existing || now > existing.resetAt) {
      await db.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      })
      return { allowed: true, remaining: maxRequests - 1 }
    }

    if (existing.count >= maxRequests) {
      return { allowed: false, remaining: 0 }
    }

    await db.rateLimit.update({
      where: { key, count: existing.count },
      data: { count: existing.count + 1 },
    })

    return { allowed: true, remaining: maxRequests - existing.count - 1 }
  } catch {
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
