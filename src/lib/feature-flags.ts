import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const cache = new Map<string, { value: boolean; expiresAt: number }>()
const CACHE_TTL = 60 * 1000

export async function isFeatureEnabled(flag: string): Promise<boolean> {
  const cached = cache.get(flag)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  try {
    const config = await db.appConfig.findUnique({ where: { key: `feature:${flag}` } })
    const enabled = config?.value === "true"
    cache.set(flag, { value: enabled, expiresAt: Date.now() + CACHE_TTL })
    return enabled
  } catch {
    logger.error("Failed to read feature flag", { flag })
    return false
  }
}

export async function setFeatureFlag(flag: string, enabled: boolean): Promise<void> {
  await db.appConfig.upsert({
    where: { key: `feature:${flag}` },
    update: { value: String(enabled) },
    create: { key: `feature:${flag}`, value: String(enabled) },
  })
  cache.delete(flag)
  logger.info("Feature flag updated", { flag, enabled })
}

export async function getAllFeatureFlags(): Promise<Record<string, boolean>> {
  try {
    const configs = await db.appConfig.findMany({
      where: { key: { startsWith: "feature:" } },
    })
    const flags: Record<string, boolean> = {}
    for (const c of configs) {
      const name = c.key.replace("feature:", "")
      flags[name] = c.value === "true"
      cache.set(name, { value: flags[name], expiresAt: Date.now() + CACHE_TTL })
    }
    return flags
  } catch {
    return {}
  }
}
