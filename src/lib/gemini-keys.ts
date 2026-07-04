import { logger } from "@/lib/logger"

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
  const key = keys[keyIndex % keys.length]
  keyIndex++
  logger.debug("Using Gemini API key", { keyIndex: keyIndex % keys.length, prefix: key.slice(0, 10) + "..." })
  return key
}

export function getGeminiKeyCount(): number {
  return getApiKeys().length
}

export function getRandomGeminiKey(): string {
  const keys = getApiKeys()
  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY configured. Set GEMINI_API_KEY_1...GEMINI_API_KEY_N or GEMINI_API_KEY")
  }
  const randomIndex = Math.floor(Math.random() * keys.length)
  logger.debug("Using random Gemini API key", { keyIndex: randomIndex, prefix: keys[randomIndex].slice(0, 10) + "..." })
  return keys[randomIndex]
}

export function resetGeminiKeyIndex(): void {
  keyIndex = 0
}