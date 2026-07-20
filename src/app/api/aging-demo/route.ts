import { NextRequest } from "next/server"
import { ok, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"

const GROQ_API_BASE = "https://api.groq.com/openai/v1"
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

const SYSTEM_PROMPT = `Eres un modelo analítico avanzado de IA especializado en estética cosmética.
Actúa como un analista cosmético profesional.
Responde exclusivamente en español.
NO eres médico. NO uses diagnósticos clínicos ni prescribas tratamientos.
Usa lenguaje descriptivo sobre características VISUALES observables.
Devuélveme los datos estructurados en este formato exacto y SOLO JSON:

{
  "summary": "Breve resumen cosmético (1-2 oraciones, SIN lenguaje clínico)",
  "scores": {
    "hydration": valor entero 0-100 (nivel de hidratación visible),
    "texture": valor entero 0-100 (uniformidad de textura),
    "firmness": valor entero 0-100 (apariencia de firmeza),
    "luminosity": valor entero 0-100 (brillo y luminosidad)
  },
  "skinAge": valor entero estimado de edad visual
}`

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

function compactImage(base64: string): string {
  if (base64.length > 500000) {
    return base64.slice(0, 250000) + base64.slice(-250000)
  }
  return base64
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

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return error("Servicio temporalmente no disponible", 503)
    }

    const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analiza esta foto facial y devuelve el JSON en el formato especificado." },
              { type: "image_url", image_url: { url: compactImage(imageBase64) } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      const text = await response.text()
      logger.error("Groq aging demo error", { status: response.status, text })
      return error("Error al procesar la imagen", 502)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return error("Respuesta vacía del modelo", 502)

    let parsed: Record<string, unknown>
    try {
      const clean = content.replace(/```json|```/g, "").trim()
      parsed = JSON.parse(clean)
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
