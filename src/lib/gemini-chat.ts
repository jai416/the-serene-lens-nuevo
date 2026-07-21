import { logger } from "@/lib/logger"

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

export class GeminiError extends Error {
  constructor(message: string, public code: string, public cause?: unknown) {
    super(message)
    this.name = "GeminiError"
  }
}

export async function chatWithGemini(message: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiError("GEMINI_API_KEY no configurada", "CONFIG_ERROR")
  }

  const url = `${GEMINI_API_URL}?key=${apiKey}`

  const body = {
    contents: [
      {
        parts: [
          {
            text: `Eres un asistente virtual de The Serene Lens, una app de análisis de piel con IA. Responde de forma amable, profesional y en español. Responde en máximo 3 párrafos. Usuario: ${message}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown")
      logger.error("Gemini API error", { status: res.status, body: text.slice(0, 500) })
      if (res.status === 429) {
        throw new GeminiError("El servicio de IA está saturado. Intenta de nuevo en unos segundos.", "RATE_LIMITED")
      }
      if (res.status === 403 || res.status === 401) {
        throw new GeminiError("Error de autenticación con la IA. Contacta al administrador.", "AUTH_ERROR")
      }
      throw new GeminiError(`Error de IA (${res.status}). Intenta de nuevo.`, "API_ERROR")
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      logger.error("Gemini empty response", { data: JSON.stringify(data).slice(0, 500) })
      throw new GeminiError("La IA no generó una respuesta. Intenta de nuevo.", "EMPTY_RESPONSE")
    }

    return text
  } catch (e) {
    if (e instanceof GeminiError) throw e
    if ((e as Error)?.name === "AbortError") {
      throw new GeminiError("La conexión con la IA tardó demasiado. Intenta de nuevo.", "TIMEOUT")
    }
    logger.error("Gemini fetch error", { error: e instanceof Error ? e.message : String(e) })
    throw new GeminiError("Error al conectar con la IA. Verifica tu conexión.", "NETWORK_ERROR")
  } finally {
    clearTimeout(timeoutId)
  }
}
