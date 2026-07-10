import { logger } from "@/lib/logger"

const GROQ_API_BASE = "https://api.groq.com/openai/v1"
const MODEL = "qwen3-32b"

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("No GROQ_API_KEY configured")
  return key
}

function extractJSON(content: string): any {
  const clean = content.replace(/```json|```/g, "").trim()
  try {
    return JSON.parse(clean)
  } catch {}
  const match = content.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {}
  }
  throw new Error("No se pudo parsear la respuesta de Groq")
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function groqChat(
  messages: { role: string; content: string }[],
  options?: {
    temperature?: number
    maxTokens?: number
    responseFormat?: "json"
    signal?: AbortSignal
    system?: string
  }
): Promise<string> {
  const key = getApiKey()
  let attempt = 0
  const maxAttempts = 3

  const groqMessages: { role: string; content: string }[] = []

  if (options?.system) {
    groqMessages.push({ role: "system", content: options.system })
  }

  groqMessages.push(...messages)

  const body: Record<string, unknown> = {
    model: MODEL,
    messages: groqMessages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 2048,
  }

  if (options?.responseFormat === "json") {
    body.response_format = { type: "json_object" }
  }

  while (attempt < maxAttempts) {
    attempt++
    try {
      const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
        signal: options?.signal ?? AbortSignal.timeout(30000),
      })

      if (res.status === 429 && attempt < maxAttempts) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000)
        logger.warn("Groq chat rate limited, retrying", { attempt, delay })
        await sleep(delay)
        continue
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Groq error ${res.status}: ${text}`)
      }

      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content
      if (!content) throw new Error("Groq returned empty response")

      if (options?.responseFormat === "json") {
        try {
          return JSON.stringify(extractJSON(content))
        } catch {
          return content
        }
      }

      return content
    } catch (e) {
      if (attempt >= maxAttempts) throw e
      if (e instanceof Error && e.name === "AbortError") throw e
      logger.warn("Groq chat attempt failed", { attempt, error: String(e) })
      await sleep(2000)
    }
  }

  throw new Error("Groq chat failed after retries")
}

export async function groqChatJSON<T = any>(
  messages: { role: string; content: string }[],
  options?: {
    temperature?: number
    maxTokens?: number
    signal?: AbortSignal
    system?: string
  }
): Promise<T> {
  const text = await groqChat(messages, { ...options, responseFormat: "json" })
  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Invalid JSON from Groq")
  }
}
