import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface FeatureFlagConfig {
  enabled: boolean
  message?: string
  redirectUrl?: string
}

const cache = new Map<string, { value: FeatureFlagConfig; expiresAt: number }>()
const CACHE_TTL = 60 * 1000

function parseFlag(value: string): FeatureFlagConfig {
  try {
    const parsed = JSON.parse(value)
    return { enabled: parsed.enabled ?? true, message: parsed.message, redirectUrl: parsed.redirectUrl }
  } catch {
    return { enabled: value === "true" }
  }
}

export async function isFeatureEnabled(flag: string): Promise<boolean> {
  const cached = cache.get(flag)
  if (cached && cached.expiresAt > Date.now()) return cached.value.enabled

  try {
    const config = await db.appConfig.findUnique({ where: { key: `feature:${flag}` } })
    const flagConfig = config ? parseFlag(config.value) : { enabled: true }
    cache.set(flag, { value: flagConfig, expiresAt: Date.now() + CACHE_TTL })
    return flagConfig.enabled
  } catch {
    return true
  }
}

export async function getFeatureFlag(flag: string): Promise<FeatureFlagConfig> {
  const cached = cache.get(flag)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  try {
    const config = await db.appConfig.findUnique({ where: { key: `feature:${flag}` } })
    const flagConfig = config ? parseFlag(config.value) : { enabled: true }
    cache.set(flag, { value: flagConfig, expiresAt: Date.now() + CACHE_TTL })
    return flagConfig
  } catch {
    return { enabled: true }
  }
}

export async function setFeatureFlag(flag: string, config: FeatureFlagConfig | boolean): Promise<void> {
  let value: string
  if (typeof config === "boolean") {
    value = JSON.stringify({ enabled: config })
  } else {
    value = JSON.stringify(config)
  }

  await db.appConfig.upsert({
    where: { key: `feature:${flag}` },
    update: { value },
    create: { key: `feature:${flag}`, value },
  })
  cache.delete(flag)
  logger.info("Feature flag updated", { flag, config })
}

export async function getAllFeatureFlags(): Promise<Record<string, FeatureFlagConfig>> {
  try {
    const configs = await db.appConfig.findMany({
      where: { key: { startsWith: "feature:" } },
    })
    const flags: Record<string, FeatureFlagConfig> = {}
    for (const c of configs) {
      const name = c.key.replace("feature:", "")
      flags[name] = parseFlag(c.value)
      cache.set(name, { value: flags[name], expiresAt: Date.now() + CACHE_TTL })
    }
    return flags
  } catch {
    return {}
  }
}
