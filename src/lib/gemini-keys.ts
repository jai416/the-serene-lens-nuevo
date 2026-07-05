import { logger } from "@/lib/logger"

export const deadKeys = new Map<string, number>()
export const DEAD_KEY_TIMEOUT = 10 * 60 * 1000

function getApiKeys(): string[] {
  const keys: string[] = []
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`]
    if (key) keys.push(key)
  }
  if (keys.length === 0) {
    const single = process.env.GEMINI_API_KEY
    if (single) keys.push(single)
  }
  return keys
}

let keyIndex = 0

export function getNextGeminiKey(): string {
  const keys = getApiKeys()
  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY configured. Set GEMINI_API_KEY_1...GEMINI_API_KEY_N or GEMINI_API_KEY")
  }
  const now = Date.now()
  const alive = keys.filter((k) => {
    const deadUntil = deadKeys.get(k) || 0
    if (deadUntil && now < deadUntil) return false
    if (deadUntil) deadKeys.delete(k)
    return true
  })
  if (alive.length === 0) {
    throw new Error("Todas las claves de Gemini están caídas")
  }
  const key = alive[keyIndex % alive.length]
  keyIndex++
  logger.debug("Using Gemini API key", { keyIndex: keyIndex % alive.length, prefix: key.slice(0, 10) + "..." })
  return key
}

export function markKeyDead(key: string) {
  deadKeys.set(key, Date.now() + DEAD_KEY_TIMEOUT)
  logger.warn("Gemini key marked as dead", { prefix: key.slice(0, 10) + "..." })
}

export function getGeminiKeyCount(): number {
  return getApiKeys().length
}

export function resetGeminiKeyIndex(): void {
  keyIndex = 0
}
