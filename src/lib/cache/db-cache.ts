import { db } from "@/lib/db"
import { getCache, setCache } from "@/lib/cache"

export async function getDBCache<T>(key: string, ttlSeconds = 86400): Promise<T | undefined> {
  const memCached = getCache<T>(key)
  if (memCached !== undefined) return memCached

  try {
    const row = await db.cache.findUnique({ where: { key } })
    if (!row) return undefined
    if (new Date() > row.expiresAt) {
      await db.cache.delete({ where: { key } }).catch(() => {})
      return undefined
    }
    const value = JSON.parse(row.value) as T
    setCache(key, value, ttlSeconds)
    return value
  } catch {
    return undefined
  }
}

export async function setDBCache<T>(key: string, value: T, ttlSeconds = 86400): Promise<void> {
  setCache(key, value, ttlSeconds)
  try {
    await db.cache.upsert({
      where: { key },
      update: { value: JSON.stringify(value), expiresAt: new Date(Date.now() + ttlSeconds * 1000) },
      create: { key, value: JSON.stringify(value), expiresAt: new Date(Date.now() + ttlSeconds * 1000) },
    })
  } catch {
    // silencio
  }
}

export async function delDBCache(key: string): Promise<void> {
  await db.cache.delete({ where: { key } }).catch(() => {})
}
