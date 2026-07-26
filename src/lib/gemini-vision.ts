import { logger } from "@/lib/logger"
import { captureError, captureMessage } from "@/lib/sentry"

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY no configurada")
  return key
}

export class GeminiVisionError extends Error {
  constructor(message: string, public code: string, public cause?: unknown) {
    super(message)
    this.name = "GeminiVisionError"
  }
}

function extractJSON(text: string): any {
  const clean = text.replace(/```json|```/g, "").trim()
  try {
    return JSON.parse(clean)
  } catch { /* try fallback regex extraction */ }
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch { /* not valid JSON either */ }
  }
  throw new GeminiVisionError("No se pudo parsear la respuesta JSON", "PARSE_ERROR")
}

export async function analyzeImageWithGemini(
  imageBase64: string,
  prompt: string,
  systemPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<any> {
  const apiKey = getApiKey()
  const url = `${GEMINI_API_URL}?key=${apiKey}`

  const body = {
    contents: [{
      parts: [
        { text: `${systemPrompt}\n\n${prompt}` },
        { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
      ],
    }],
    generationConfig: {
      temperature: options?.temperature ?? 0.2,
      maxOutputTokens: options?.maxTokens ?? 2048,
    },
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown")
      logger.error("Gemini vision error", { status: res.status, body: text.slice(0, 500) })
      if (res.status === 403 || res.status === 401) {
        captureMessage("GEMINI_API_KEY expirada o inválida", { status: res.status, body: text.slice(0, 200) })
        throw new GeminiVisionError("Error de autenticación con la IA. La API Key podría estar expirada.", "AUTH_ERROR")
      }
      if (res.status === 429) {
        throw new GeminiVisionError("Demasiadas solicitudes a la IA. Espera un momento.", "RATE_LIMITED")
      }
      throw new GeminiVisionError(`Error de IA (${res.status}). Intenta de nuevo.`, "API_ERROR")
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      logger.error("Gemini empty response", { data: JSON.stringify(data).slice(0, 500) })
      throw new GeminiVisionError("La IA no generó una respuesta.", "EMPTY_RESPONSE")
    }

    return extractJSON(text)
  } catch (e) {
    if (e instanceof GeminiVisionError) throw e
    if ((e as Error)?.name === "AbortError") {
      throw new GeminiVisionError("La conexión con la IA tardó demasiado.", "TIMEOUT")
    }
    logger.error("Gemini vision fetch error", { error: e instanceof Error ? e.message : String(e) })
    captureError(e, { context: "analyzeImageWithGemini" })
    throw new GeminiVisionError("Error al conectar con la IA.", "NETWORK_ERROR")
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function analyzeMultipleImagesWithGemini(
  imagesBase64: string[],
  prompt: string,
  systemPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<any> {
  const apiKey = getApiKey()
  const url = `${GEMINI_API_URL}?key=${apiKey}`

  const parts: Record<string, unknown>[] = [
    { text: `${systemPrompt}\n\n${prompt}` },
    ...imagesBase64.map((base64) => ({
      inline_data: { mime_type: "image/jpeg", data: base64 },
    })),
  ]

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: options?.temperature ?? 0.2,
      maxOutputTokens: options?.maxTokens ?? 4096,
    },
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90000)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown")
      logger.error("Gemini multi-image error", { status: res.status, body: text.slice(0, 500) })
      if (res.status === 403 || res.status === 401) {
        captureMessage("GEMINI_API_KEY expirada o inválida (multi-image)", { status: res.status, body: text.slice(0, 200) })
        throw new GeminiVisionError("Error de autenticación con la IA. La API Key podría estar expirada.", "AUTH_ERROR")
      }
      if (res.status === 429) {
        throw new GeminiVisionError("Demasiadas solicitudes. Espera un momento.", "RATE_LIMITED")
      }
      throw new GeminiVisionError(`Error de IA (${res.status}).`, "API_ERROR")
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      logger.error("Gemini empty multi-image response", { data: JSON.stringify(data).slice(0, 500) })
      throw new GeminiVisionError("La IA no generó una respuesta.", "EMPTY_RESPONSE")
    }

    return extractJSON(text)
  } catch (e) {
    if (e instanceof GeminiVisionError) throw e
    if ((e as Error)?.name === "AbortError") {
      throw new GeminiVisionError("La conexión con la IA tardó demasiado.", "TIMEOUT")
    }
    logger.error("Gemini multi-image fetch error", { error: e instanceof Error ? e.message : String(e) })
    captureError(e, { context: "analyzeMultipleImagesWithGemini" })
    throw new GeminiVisionError("Error al conectar con la IA.", "NETWORK_ERROR")
  } finally {
    clearTimeout(timeoutId)
  }
}
