import { NextRequest } from "next/server"
import { ok, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"

const ipHits = new Map<string, number[]>()
const MAX_HITS = 3
const WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const hits = ipHits.get(ip) || []
  const recent = hits.filter((h) => now - h < WINDOW_MS)
  if (recent.length >= MAX_HITS) return false
  recent.push(now)
  ipHits.set(ip, recent)
  return true
}

const AGING_SCHEMA = {
  name: "aging_prediction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
      scores: {
        type: "object",
        properties: {
          hydration: { type: "integer" },
          texture: { type: "integer" },
          firmness: { type: "integer" },
          luminosity: { type: "integer" },
        },
        required: ["hydration", "texture", "firmness", "luminosity"],
        additionalProperties: false,
      },
      skinAge: { type: "integer" },
    },
    required: ["summary", "scores", "skinAge"],
    additionalProperties: false,
  },
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() || "unknown"

    if (!checkRateLimit(ip)) {
      return error("Límite de 3 análisis por hora alcanzado. Intenta más tarde.", 429)
    }

    const body = await req.json()
    const { imageBase64 } = body

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return error("Imagen requerida", 400)
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return error("Servicio temporalmente no disponible", 503)
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com",
        "X-Title": "The Serene Lens - Aging Demo",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        response_format: { type: "json_schema", json_schema: AGING_SCHEMA },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
              {
                type: "text",
                text: `Eres un modelo analítico avanzado de IA especializado en estética cosmética. Analiza esta foto facial y devuelve ÚNICAMENTE un JSON con esta estructura exacta:
{
  "summary": "Breve resumen cosmético (1-2 oraciones, SIN lenguaje clínico)",
  "scores": {
    "hydration": valor entero 0-100 (nivel de hidratación visible),
    "texture": valor entero 0-100 (uniformidad de textura),
    "firmness": valor entero 0-100 (apariencia de firmeza),
    "luminosity": valor entero 0-100 (brillo y luminosidad)
  },
  "skinAge": valor entero estimado de edad visual
}
IMPORTANTE: Solo devuelve el JSON, nada más.`,
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      logger.error("OpenRouter demo error", { status: response.status })
      return error("Error al procesar la imagen", 502)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return error("Respuesta vacía del modelo", 502)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content)
    } catch {
      return error("Respuesta inválida del modelo", 502)
    }

    const scores = parsed.scores as Record<string, number> | undefined
    if (!scores) return error("Puntajes no encontrados", 502)

    const clamp = (v: unknown) => Math.max(0, Math.min(100, Number(v) || 0))

    return ok({
      scores: {
        hydration: clamp(scores.hydration),
        texture: clamp(scores.texture),
        firmness: clamp(scores.firmness),
        luminosity: clamp(scores.luminosity),
      },
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 300) : "",
      skinAge: typeof parsed.skinAge === "number" ? Math.max(10, Math.min(80, parsed.skinAge)) : null,
    })
  } catch (e) {
    console.error("Aging demo error:", e)
    return error("Error interno", 500)
  }
}
