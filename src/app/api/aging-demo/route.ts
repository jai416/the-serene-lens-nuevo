import { NextRequest } from "next/server"
import { ok, error } from "@/lib/api-response"
import { analyzeImageWithGemini } from "@/lib/gemini-vision"

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

    const prompt = "Analiza esta foto facial y devuelve el JSON en el formato especificado."
    const parsed = await analyzeImageWithGemini(imageBase64, prompt, SYSTEM_PROMPT, {
      temperature: 0.2,
      maxTokens: 800,
    })

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
    const msg = e instanceof Error ? e.message : String(e)
    return error(msg, 500)
  }
}
