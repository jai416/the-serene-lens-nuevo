import { redisGet, redisSet, redisDel, redisFlushAll, isRedisConfigured } from "./redis"

export interface CacheAdapter {
  get<T = unknown>(key: string): T | undefined
  set<T>(key: string, value: T, ttlSeconds?: number): void
  del(key: string): void
  flushAll(): void
}

function createMemoryCache(): CacheAdapter {
  const store = new Map<string, { value: unknown; expiresAt: number }>()

  return {
    get<T>(key: string): T | undefined {
      const entry = store.get(key)
      if (!entry) return undefined
      if (Date.now() > entry.expiresAt) {
        store.delete(key)
        return undefined
      }
      return entry.value as T
    },
    set<T>(key: string, value: T, ttlSeconds = 600): void {
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
    },
    del(key: string): void {
      store.delete(key)
    },
    flushAll(): void {
      store.clear()
    },
  }
}

let memoryCache: CacheAdapter | null = null

function getCacheAdapter(): CacheAdapter {
  if (memoryCache) return memoryCache
  memoryCache = createMemoryCache()
  return memoryCache
}

function useRedis(): boolean {
  return isRedisConfigured()
}

export async function getCache<T = unknown>(key: string): Promise<T | undefined> {
  if (useRedis()) {
    const val = await redisGet<T>(key)
    if (val !== undefined) return val
  }
  return getCacheAdapter().get<T>(key)
}

export async function setCache<T>(key: string, value: T, ttlSeconds = 600): Promise<void> {
  if (useRedis()) {
    await redisSet(key, value, ttlSeconds)
  }
  getCacheAdapter().set(key, value, ttlSeconds)
}

export async function delCache(key: string): Promise<void> {
  if (useRedis()) {
    await redisDel(key)
  }
  getCacheAdapter().del(key)
}

export async function clearCache(): Promise<void> {
  if (useRedis()) {
    await redisFlushAll()
  }
  getCacheAdapter().flushAll()
}
