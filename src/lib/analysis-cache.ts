import { db } from "@/lib/db"
import { createHash } from "crypto"

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

function hashKey(imagesBase64: string[], concerns?: string, age?: string): string {
  const hash = createHash("sha256")
  for (const img of imagesBase64) hash.update(img.slice(0, 500))
  if (concerns) hash.update(concerns)
  if (age) hash.update(age)
  return "skin_cache:" + hash.digest("hex").slice(0, 32)
}

export async function getCachedAnalysis(
  imagesBase64: string[],
  concerns?: string,
  age?: string
): Promise<Record<string, unknown> | null> {
  try {
    const key = hashKey(imagesBase64, concerns, age)
    const cached = await db.cache.findUnique({ where: { key } })
    if (!cached) return null
    if (cached.expiresAt < new Date()) {
      await db.cache.delete({ where: { key } }).catch(() => {})
      return null
    }
    return JSON.parse(cached.value)
  } catch {
    return null
  }
}

export async function setCachedAnalysis(
  imagesBase64: string[],
  concerns: string | undefined,
  age: string | undefined,
  result: Record<string, unknown>
): Promise<void> {
  try {
    const key = hashKey(imagesBase64, concerns, age)
    await db.cache.upsert({
      where: { key },
      create: {
        key,
        value: JSON.stringify(result),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
      update: {
        value: JSON.stringify(result),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
    })
  } catch {
    // cache is optional, don't break the flow
  }
}
