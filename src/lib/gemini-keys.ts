let keyIndex = 0

export function getNextGeminiKey(): string {
  const key1 = process.env.GEMINI_API_KEY_1
  const key2 = process.env.GEMINI_API_KEY_2
  if (!key1 && !key2) {
    const single = process.env.GEMINI_API_KEY
    if (single) return single
    throw new Error("No GEMINI_API_KEY configured")
  }
  const keys = [key1, key2].filter(Boolean) as string[]
  const key = keys[keyIndex % keys.length]
  keyIndex++
  return key
}
