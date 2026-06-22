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

let cache: CacheAdapter | null = null

function getCacheAdapter(): CacheAdapter {
  if (cache) return cache

  try {
    const NodeCache = require("node-cache")
    cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }) as CacheAdapter
  } catch {
    cache = createMemoryCache()
  }

  return cache
}

export function getCache<T = unknown>(key: string): T | undefined {
  return getCacheAdapter().get<T>(key)
}

export function setCache<T>(key: string, value: T, ttlSeconds = 600): void {
  getCacheAdapter().set(key, value, ttlSeconds)
}

export function delCache(key: string): void {
  getCacheAdapter().del(key)
}

export function clearCache(): void {
  getCacheAdapter().flushAll()
}

export function createRedisCache(url?: string): CacheAdapter {
  throw new Error(
    "Redis cache not yet implemented. Set REDIS_URL env var and install ioredis to enable."
  )
}
