import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import {
  matchIngredientsToAnalysis,
  formatIngredientsForPrompt,
} from "@/lib/ingredient-kb"
import { groqChatJSON } from "@/lib/groq-chat"
import { validateCsrf } from "@/lib/csrf-middleware"

const GROQ_API_BASE = "https://api.groq.com/openai/v1"
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

function getApiKey(): string {
  return process.env.GROQ_API_KEY || ""
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    return Buffer.from(buffer).toString("base64")
  } catch {
    return null
  }
}

function sanitizeScore(val: unknown): number {
  const n = typeof val === "number" ? val : typeof val === "string" ? parseInt(val, 10) : 0
  if (isNaN(n)) return 0
  return Math.max(-50, Math.min(50, Math.round(n)))
}

function sanitizeStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.filter((v): v is string => typeof v === "string" && v.length > 0)
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized("Debes iniciar sesión")

    const body = await req.json().catch(() => ({}))
    const { firstAnalysisId, latestAnalysisId } = body as {
      firstAnalysisId?: string
      latestAnalysisId?: string
    }

    let firstAnalysis
    let latestAnalysis

    if (firstAnalysisId && latestAnalysisId) {
      const [first, latest] = await Promise.all([
        db.skinAnalysis.findUnique({
          where: { id: firstAnalysisId },
          select: {
            id: true,
            userId: true,
            skinType: true,
            observations: true,
            imageUrl: true,
            createdAt: true,
          },
        }),
        db.skinAnalysis.findUnique({
          where: { id: latestAnalysisId },
          select: {
            id: true,
            userId: true,
            skinType: true,
            observations: true,
            imageUrl: true,
            createdAt: true,
          },
        }),
      ])

      if (!first || !latest) return error("No se encontraron los análisis especificados", 404)
      if (first.userId !== session.user.id || latest.userId !== session.user.id) {
        return unauthorized("Estos análisis no son tuyos")
      }

      firstAnalysis = first
      latestAnalysis = latest
    } else {
      const analyses = await db.skinAnalysis.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          userId: true,
          skinType: true,
          observations: true,
          imageUrl: true,
          createdAt: true,
        },
      })

      if (analyses.length < 2) {
        return error("Necesitas al menos dos análisis para ver la comparación evolutiva.", 404)
      }

      firstAnalysis = analyses[0]
      latestAnalysis = analyses[analyses.length - 1]
    }

    let firstObs: string[] = []
    let latestObs: string[] = []
    try {
      firstObs = JSON.parse(firstAnalysis.observations || "[]")
    } catch {}
    try {
      latestObs = JSON.parse(latestAnalysis.observations || "[]")
    } catch {}

    const matched = matchIngredientsToAnalysis(
      [...firstObs, ...latestObs],
      latestAnalysis.skinType || ""
    )
    const ragContext = formatIngredientsForPrompt(matched)

    const [firstB64, latestB64] = await Promise.all([
      firstAnalysis.imageUrl ? fetchImageAsBase64(firstAnalysis.imageUrl) : Promise.resolve(null),
      latestAnalysis.imageUrl ? fetchImageAsBase64(latestAnalysis.imageUrl) : Promise.resolve(null),
    ])

    const imagesAvailable = Boolean(firstB64 && latestB64)

    const firstDate = firstAnalysis.createdAt.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    const latestDate = latestAnalysis.createdAt.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const textContext = `
ANÁLISIS INICIAL (${firstDate}):
- Tipo de piel: ${firstAnalysis.skinType || "No determinado"}
- Observaciones: ${firstObs.join("; ") || "Sin observaciones registradas"}

ANÁLISIS RECIENTE (${latestDate}):
- Tipo de piel: ${latestAnalysis.skinType || "No determinado"}
- Observaciones: ${latestObs.join("; ") || "Sin observaciones registradas"}

${ragContext}

REGLAS CRÍTICAS:
- NO eres médico. NO uses diagnósticos clínicos ni prescribas tratamientos.
- Eres un modelo analítico de OBSERVACIÓN COSMÉTICA. Compara las dos imágenes usando lenguaje descriptivo.
- Calcula el delta de cada score restando el score del primer análisis del segundo (positivo = mejoría, negativo = deterioro).
- Todas las recomendaciones deben referenciar ingredientes activos cosméticos por nombre.
- NO uses porcentajes inventados en el texto resumen. Usa etiquetas descriptivas.
- Los scores numéricos (0-100) son para visualización en gráficos.

Proporciona tu análisis en la estructura JSON exacta especificada.`

    const VISION_SYSTEM = `Eres un experto en análisis cosmético de piel. Responde exclusivamente en español. Compara dos imágenes o análisis de la misma persona tomados en momentos diferentes. NO eres médico. NO uses diagnósticos clínicos. Usa lenguaje descriptivo sobre características VISUALES observables. Devuelve los datos en formato JSON estructurado.`

    logger.info("Skin comparison started", {
      userId: session.user.id,
      firstAnalysisId: firstAnalysis.id,
      latestAnalysisId: latestAnalysis.id,
      imagesAvailable,
      ragIngredients: matched.length,
    })

    let parsed: Record<string, unknown>

    if (imagesAvailable) {
      const apiKey = getApiKey()
      const visionBody = {
        model: MODEL,
        messages: [
          { role: "system", content: VISION_SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: `Compara estas dos imágenes de la misma persona tomadas en momentos diferentes y genera un informe de evolución.\n\n${textContext}` },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${firstB64}` } },
              { type: "text", text: "Imagen INICIAL (antes)." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${latestB64}` } },
              { type: "text", text: "Imagen RECIENTE (después). Responde con el JSON especificado." },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }

      const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(visionBody),
        signal: AbortSignal.timeout(60000),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Groq error ${res.status}: ${text}`)
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error("No response from AI")
      const clean = content.replace(/```json|```/g, "").trim()
      try {
        parsed = JSON.parse(clean)
      } catch {
        throw new Error("AI returned invalid JSON: " + clean.slice(0, 200))
      }
    } else {
      const prompt = `Compara estos dos análisis y genera un informe de evolución.\n\n${textContext}`
      parsed = await groqChatJSON<Record<string, unknown>>(
        [{ role: "user", content: prompt }],
        { temperature: 0.2, maxTokens: 2048, system: VISION_SYSTEM }
      )
    }

    const comparison = {
      summary: typeof parsed.summary === "string" ? parsed.summary : "Comparación no disponible.",
      improvements: sanitizeStringArray(parsed.improvements),
      concerns: sanitizeStringArray(parsed.concerns),
      scoreDelta: {
        hydration: sanitizeScore(
          (parsed.scoreDelta as Record<string, unknown>)?.hydration
        ),
        texture: sanitizeScore(
          (parsed.scoreDelta as Record<string, unknown>)?.texture
        ),
        firmness: sanitizeScore(
          (parsed.scoreDelta as Record<string, unknown>)?.firmness
        ),
        luminosity: sanitizeScore(
          (parsed.scoreDelta as Record<string, unknown>)?.luminosity
        ),
      },
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
            .filter(
              (r: unknown): r is { ingredient: string; reason: string } =>
                typeof r === "object" &&
                r !== null &&
                "ingredient" in r &&
                "reason" in r &&
                typeof (r as any).ingredient === "string" &&
                typeof (r as any).reason === "string"
            )
            .slice(0, 8)
        : [],
    }

    logger.info("Skin comparison completed", {
      userId: session.user.id,
      firstAnalysisId: firstAnalysis.id,
      latestAnalysisId: latestAnalysis.id,
    })

    return ok({
      comparison,
      firstAnalysis: {
        id: firstAnalysis.id,
        skinType: firstAnalysis.skinType,
        createdAt: firstAnalysis.createdAt,
        photoUrl: firstAnalysis.imageUrl,
      },
      latestAnalysis: {
        id: latestAnalysis.id,
        skinType: latestAnalysis.skinType,
        createdAt: latestAnalysis.createdAt,
        photoUrl: latestAnalysis.imageUrl,
      },
    })
  } catch (e) {
    logger.error("Skin comparison failed", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
