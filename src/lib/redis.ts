import { captureError } from "./sentry"

const DEFAULT_TTL = 600

let redisInstance: any = null

async function getRedis() {
  if (redisInstance) return redisInstance
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  try {
    const { Redis } = await import("@upstash/redis")
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    return redisInstance
  } catch (e) {
    captureError(e, { context: "redis.getRedis" })
    return null
  }
}

export async function redisGet<T = unknown>(key: string): Promise<T | undefined> {
  try {
    const r = await getRedis()
    if (!r) return undefined
    return (await r.get(key)) as T ?? undefined
  } catch (e) {
    captureError(e, { context: "redis.redisGet", key })
    return undefined
  }
}

/**
 * Como redisGet pero LANZA el error en vez de devolver undefined.
 * Útil donde "no existe" y "Redis caído" no son lo mismo (rate limits):
 * el caller puede caer a su fallback (DB) en vez de fallar open.
 */
export async function redisGetStrict<T = unknown>(key: string): Promise<T | undefined> {
  const r = await getRedis()
  if (!r) throw new Error("Redis no disponible")
  return (await r.get(key)) as T ?? undefined
}

/** Como redisSet pero LANZA el error (ver redisGetStrict). */
export async function redisSetStrict<T = unknown>(key: string, value: T, ttlSeconds = DEFAULT_TTL): Promise<void> {
  const r = await getRedis()
  if (!r) throw new Error("Redis no disponible")
  await r.set(key, value, { ex: ttlSeconds })
}

export async function redisSet<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL): Promise<void> {
  try {
    const r = await getRedis()
    if (!r) return
    await r.set(key, value, { ex: ttlSeconds })
  } catch (e) {
    captureError(e, { context: "redis.redisSet", key })
  }
}

export async function redisDel(key: string): Promise<void> {
  try {
    const r = await getRedis()
    if (!r) return
    await r.del(key)
  } catch (e) {
    captureError(e, { context: "redis.redisDel", key })
  }
}

export async function redisFlushAll(): Promise<void> {
  try {
    const r = await getRedis()
    if (!r) return
    await r.flushall()
  } catch (e) {
    captureError(e, { context: "redis.redisFlushAll" })
  }
}

export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
