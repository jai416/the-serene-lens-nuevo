import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  matchIngredientsToAnalysis,
  formatIngredientsForPrompt,
} from "@/lib/ingredient-kb"
import { groqChatJSON } from "@/lib/groq-chat"

const SYSTEM = `Eres un modelo analítico avanzado de IA especializado en estética cosmética. Responde exclusivamente en español. NO eres médico. NO uses diagnósticos clínicos ni prescribas tratamientos. Usa lenguaje descriptivo sobre características VISUALES observables. Los scores numéricos (0-100) son SOLO para visualización en gráficos. Todas las recomendaciones deben referenciar ingredientes activos cosméticos por nombre. Devuelve los datos en formato JSON estructurado exacto.`

function sanitizeScore(val: unknown): number {
  const n = typeof val === "number" ? val : typeof val === "string" ? parseInt(val, 10) : 50
  if (isNaN(n)) return 50
  return Math.max(0, Math.min(100, Math.round(n)))
}

function sanitizeTrend(val: unknown): "improving" | "stable" | "declining" {
  if (val === "improving" || val === "stable" || val === "declining") return val
  return "stable"
}

function sanitizePrediction(raw: Record<string, unknown>) {
  const current = (raw.currentScore || {}) as Record<string, unknown>
  const projection = (raw.fiveYearProjection || {}) as Record<string, unknown>
  const trends = (raw.trends || {}) as Record<string, unknown>

  return {
    summary: typeof raw.summary === "string" ? raw.summary : "Análisis no disponible.",
    currentScore: {
      hydration: sanitizeScore(current.hydration),
      texture: sanitizeScore(current.texture),
      firmness: sanitizeScore(current.firmness),
      luminosity: sanitizeScore(current.luminosity),
      sensitivity: sanitizeScore(current.sensitivity),
    },
    fiveYearProjection: {
      hydration: sanitizeScore(projection.hydration),
      texture: sanitizeScore(projection.texture),
      firmness: sanitizeScore(projection.firmness),
      luminosity: sanitizeScore(projection.luminosity),
      sensitivity: sanitizeScore(projection.sensitivity),
    },
    trends: {
      hydration: sanitizeTrend(trends.hydration),
      texture: sanitizeTrend(trends.texture),
      firmness: sanitizeTrend(trends.firmness),
      luminosity: sanitizeTrend(trends.luminosity),
      sensitivity: sanitizeTrend(trends.sensitivity),
    },
    keyFactors: Array.isArray(raw.keyFactors)
      ? raw.keyFactors.map((f: any) => ({
          factor: typeof f.factor === "string" ? f.factor : "N/A",
          impact: ["high", "medium", "low"].includes(f.impact) ? f.impact : "medium",
          description: typeof f.description === "string" ? f.description : "",
        }))
      : [],
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations.map((r: any) => ({
          priority: ["essential", "important", "optional"].includes(r.priority) ? r.priority : "optional",
          category: ["hydration", "protection", "treatment", "lifestyle"].includes(r.category)
            ? r.category
            : "treatment",
          title: typeof r.title === "string" ? r.title : "Sin título",
          description: typeof r.description === "string" ? r.description : "",
          ingredients: Array.isArray(r.ingredients) ? r.ingredients.filter((i: any) => typeof i === "string") : [],
        }))
      : [],
  }
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  function sendSSE(controller: ReadableStreamDefaultController<Uint8Array>, data: Record<string, unknown>) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  const stream = new ReadableStream({
    start: async (controller) => {
      let closed = false

      const safeSend = (data: Record<string, unknown>) => {
        if (!closed) {
          try {
            sendSSE(controller, data)
          } catch {
            closed = true
          }
        }
      }

      const closeStream = () => {
        if (closed) return
        closed = true
        try {
          controller.close()
        } catch {
          // already closed
        }
      }

      const heartbeat = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"))
          } catch {
            clearInterval(heartbeat)
          }
        } else {
          clearInterval(heartbeat)
        }
      }, 4000)

      try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
          safeSend({ stage: "error", message: "Debes iniciar sesión" })
          closeStream()
          return
        }

        safeSend({ stage: "validating", message: "Validando datos..." })

        const body = await req.json()
        const { analysisId, language = "es" } = body as {
          analysisId?: string
          language?: string
        }

        let analysis
        if (analysisId) {
          analysis = await db.skinAnalysis.findUnique({
            where: { id: analysisId },
            select: {
              id: true,
              skinType: true,
              concerns: true,
              observations: true,
              recommendations: true,
              routine: true,
              createdAt: true,
              userId: true,
            },
          })
        } else {
          analysis = await db.skinAnalysis.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              skinType: true,
              concerns: true,
              observations: true,
              recommendations: true,
              routine: true,
              createdAt: true,
              userId: true,
            },
          })
        }

        if (!analysis) {
          safeSend({ stage: "error", message: "No hay análisis disponibles. Realiza un análisis primero." })
          closeStream()
          return
        }
        if (analysis.userId !== session.user.id) {
          safeSend({ stage: "error", message: "Este análisis no es tuyo" })
          closeStream()
          return
        }

        safeSend({ stage: "analyzing", message: "Preparando contexto de ingredientes..." })

        let observations: string[] = []
        let recs: string[] = []
        let skinType = analysis.skinType || ""
        try {
          observations = JSON.parse(analysis.observations || "[]")
        } catch {}
        try {
          recs = JSON.parse(analysis.recommendations || "[]")
        } catch {}

        const matched = matchIngredientsToAnalysis(observations, skinType)
        const ragContext = formatIngredientsForPrompt(matched)

        const isEnglish = language === "en"

        const prompt = isEnglish
          ? `You are an advanced analytical AI model specialized in cosmetic aesthetics. Analyze the following skin data and provide a 5-year evolution projection.

CURRENT ANALYSIS:
- Skin type: ${skinType}
- Observations: ${observations.join("; ")}
- Current recommendations: ${recs.join("; ")}

${ragContext}

CRITICAL RULES:
- You are NOT a doctor. Do NOT use clinical diagnoses or prescribe treatments.
- You are an analytical model for COSMETIC OBSERVATION. Use descriptive language about visible characteristics.
- Use descriptive labels, NOT invented percentages for the summary text.
- The numeric scores (0-100) are for visual chart display ONLY — they represent relative visual assessment, not medical measurements.
- All recommendations must reference specific cosmetic ingredients by name.
- Base projections on the observed skin characteristics and known cosmetic ingredient science.
- Do NOT claim to predict diseases or medical conditions.

Provide your analysis in the exact JSON structure specified.

{
  "summary": "string - descriptive analysis and projection",
  "currentScore": {"hydration": 0-100, "texture": 0-100, "firmness": 0-100, "luminosity": 0-100, "sensitivity": 0-100},
  "fiveYearProjection": {"hydration": 0-100, "texture": 0-100, "firmness": 0-100, "luminosity": 0-100, "sensitivity": 0-100},
  "trends": {"hydration": "improving|stable|declining", "texture": "improving|stable|declining", "firmness": "improving|stable|declining", "luminosity": "improving|stable|declining", "sensitivity": "improving|stable|declining"},
  "keyFactors": [{"factor": "string", "impact": "high|medium|low", "description": "string"}],
  "recommendations": [{"priority": "essential|important|optional", "category": "hydration|protection|treatment|lifestyle", "title": "string", "description": "string", "ingredients": ["string"]}]
}`
          : `Eres un modelo analítico avanzado de IA especializado en estética cosmética. Analiza los siguientes datos de piel y proporciona una proyección de evolución a 5 años.

ANÁLISIS ACTUAL:
- Tipo de piel: ${skinType}
- Observaciones: ${observations.join("; ")}
- Recomendaciones actuales: ${recs.join("; ")}

${ragContext}

REGLAS CRÍTICAS:
- NO eres médico. NO uses diagnósticos clínicos ni prescribas tratamientos.
- Eres un modelo analítico de OBSERVACIÓN COSMÉTICA. Usa lenguaje descriptivo sobre características visibles.
- NO uses porcentajes inventados en el texto resumen. Usa etiquetas descriptivas.
- Los scores numéricos (0-100) son SOLO para visualización en gráficos — representan evaluación visual relativa, NO mediciones médicas.
- Todas las recomendaciones deben referenciar ingredientes activos cosméticos por nombre.
- Las proyecciones deben basarse en las características observadas y la ciencia conocida de ingredientes cosméticos.
- NO predigas enfermedades ni condiciones médicas.

Proporciona tu análisis en la estructura JSON exacta especificada.

{
  "summary": "string - análisis descriptivo y proyección",
  "currentScore": {"hydration": 0-100, "texture": 0-100, "firmness": 0-100, "luminosity": 0-100, "sensitivity": 0-100},
  "fiveYearProjection": {"hydration": 0-100, "texture": 0-100, "firmness": 0-100, "luminosity": 0-100, "sensitivity": 0-100},
  "trends": {"hydration": "improving|stable|declining", "texture": "improving|stable|declining", "firmness": "improving|stable|declining", "luminosity": "improving|stable|declining", "sensitivity": "improving|stable|declining"},
  "keyFactors": [{"factor": "string", "impact": "high|medium|low", "description": "string"}],
  "recommendations": [{"priority": "essential|important|optional", "category": "hydration|protection|treatment|lifestyle", "title": "string", "description": "string", "ingredients": ["string"]}]
}`

        safeSend({ stage: "processing", message: "Generando predicción con IA..." })

        const parsed = await groqChatJSON<Record<string, unknown>>(
          [{ role: "user", content: prompt }],
          { temperature: 0.3, maxTokens: 4096, system: SYSTEM }
        )

        const prediction = sanitizePrediction(parsed)

        logger.info("Aging prediction completed", {
          userId: session.user.id,
          analysisId: analysis.id,
        })

        safeSend({
          stage: "complete",
          message: "Predicción completada",
          prediction,
          analysisId: analysis.id,
          analysisDate: analysis.createdAt,
        })

        if (!closed) {
          try {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          } catch {}
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        logger.error("Aging prediction failed", { error: msg })

        if (msg.includes("ETIMEDOUT") || msg.includes("fetch failed")) {
          safeSend({ stage: "error", message: "El servicio de predicción IA está temporalmente no disponible." })
        } else {
          safeSend({ stage: "error", message: msg || "Error desconocido" })
        }
      } finally {
        clearInterval(heartbeat)
        closeStream()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
