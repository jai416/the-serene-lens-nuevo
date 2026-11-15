import { logger } from "@/lib/logger"
import { captureError, captureMessage } from "@/lib/sentry"

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
const NVIDIA_MODEL = "meta/llama-3.2-90b-vision-instruct"

function getApiKey(): string {
  const key = process.env.NVIDIA_API_KEY
  if (!key) throw new Error("NVIDIA_API_KEY no configurada")
  return key
}

export class NvidiaVisionError extends Error {
  constructor(message: string, public code: string, public cause?: unknown) {
    super(message)
    this.name = "NvidiaVisionError"
  }
}

function extractJSON(text: string): any {
  const clean = text.replace(/```json|```/g, "").trim()
  try {
    return JSON.parse(clean)
  } catch {}
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {}
  }
  throw new NvidiaVisionError("No se pudo parsear la respuesta JSON", "PARSE_ERROR")
}

export async function analyzeImageWithNvidia(
  imageBase64: string,
  prompt: string,
  systemPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<any> {
  const apiKey = getApiKey()

  const body = {
    model: NVIDIA_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `${systemPrompt}\n\n${prompt}` },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    max_tokens: options?.maxTokens ?? 2048,
    temperature: options?.temperature ?? 0.2,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000)

  try {
    const res = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown")
      logger.error("NVIDIA vision error", { status: res.status, body: text.slice(0, 500) })
      if (res.status === 403 || res.status === 401) {
        captureMessage("NVIDIA_API_KEY inválida", { status: res.status, body: text.slice(0, 200) })
        throw new NvidiaVisionError("Error de autenticación con NVIDIA.", "AUTH_ERROR")
      }
      if (res.status === 429) {
        throw new NvidiaVisionError("Demasiadas solicitudes a NVIDIA. Espera un momento.", "RATE_LIMITED")
      }
      throw new NvidiaVisionError(`Error de NVIDIA (${res.status}). Intenta de nuevo.`, "API_ERROR")
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      logger.error("NVIDIA empty response", { data: JSON.stringify(data).slice(0, 500) })
      throw new NvidiaVisionError("NVIDIA no generó una respuesta.", "EMPTY_RESPONSE")
    }

    return extractJSON(text)
  } catch (e) {
    if (e instanceof NvidiaVisionError) throw e
    if ((e as Error)?.name === "AbortError") {
      throw new NvidiaVisionError("La conexión con NVIDIA tardó demasiado.", "TIMEOUT")
    }
    logger.error("NVIDIA vision fetch error", { error: e instanceof Error ? e.message : String(e) })
    captureError(e, { context: "analyzeImageWithNvidia" })
    throw new NvidiaVisionError("Error al conectar con NVIDIA.", "NETWORK_ERROR")
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function analyzeMultipleImagesWithNvidia(
  imagesBase64: string[],
  prompt: string,
  systemPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<any> {
  const apiKey = getApiKey()

  const content: Record<string, unknown>[] = [
    { type: "text", text: `${systemPrompt}\n\n${prompt}` },
    ...imagesBase64.map((base64) => ({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${base64}` },
    })),
  ]

  const body = {
    model: NVIDIA_MODEL,
    messages: [{ role: "user", content }],
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.2,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 180000)

  try {
    const res = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown")
      logger.error("NVIDIA multi-image error", { status: res.status, body: text.slice(0, 500) })
      if (res.status === 403 || res.status === 401) {
        captureMessage("NVIDIA_API_KEY inválida (multi-image)", { status: res.status, body: text.slice(0, 200) })
        throw new NvidiaVisionError("Error de autenticación con NVIDIA.", "AUTH_ERROR")
      }
      if (res.status === 429) {
        throw new NvidiaVisionError("Demasiadas solicitudes. Espera un momento.", "RATE_LIMITED")
      }
      throw new NvidiaVisionError(`Error de NVIDIA (${res.status}).`, "API_ERROR")
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      logger.error("NVIDIA empty multi-image response", { data: JSON.stringify(data).slice(0, 500) })
      throw new NvidiaVisionError("NVIDIA no generó una respuesta.", "EMPTY_RESPONSE")
    }

    return extractJSON(text)
  } catch (e) {
    if (e instanceof NvidiaVisionError) throw e
    if ((e as Error)?.name === "AbortError") {
      throw new NvidiaVisionError("La conexión con NVIDIA tardó demasiado.", "TIMEOUT")
    }
    logger.error("NVIDIA multi-image fetch error", { error: e instanceof Error ? e.message : String(e) })
    captureError(e, { context: "analyzeMultipleImagesWithNvidia" })
    throw new NvidiaVisionError("Error al conectar con NVIDIA.", "NETWORK_ERROR")
  } finally {
    clearTimeout(timeoutId)
  }
}
