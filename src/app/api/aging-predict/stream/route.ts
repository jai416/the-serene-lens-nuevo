import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { withRetry } from "@/lib/retry"
import { logger } from "@/lib/logger"
import {
  matchIngredientsToAnalysis,
  formatIngredientsForPrompt,
} from "@/lib/ingredient-kb"

function getApiKey(): string {
  return process.env.OPENROUTER_API_KEY || ""
}

const AGING_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description:
        "Análisis descriptivo del estado actual de la piel y proyección de evolución. Solo observaciones visuales, sin diagnósticos médicos.",
    },
    currentScore: {
      type: "object",
      properties: {
        hydration: { type: "number", description: "Nivel de hidratación visible (0-100)" },
        texture: { type: "number", description: "Uniformidad de textura visible (0-100)" },
        firmness: { type: "number", description: "Firmeza aparente (0-100)" },
        luminosity: { type: "number", description: "Luminosidad y uniformidad de tono (0-100)" },
        sensitivity: { type: "number", description: "Nivel de sensibilidad aparente (0-100, alto = más sensible)" },
      },
      required: ["hydration", "texture", "firmness", "luminosity", "sensitivity"],
    },
    fiveYearProjection: {
      type: "object",
      properties: {
        hydration: { type: "number", description: "Proyección de hidratación a 5 años (0-100)" },
        texture: { type: "number", description: "Proyección de textura a 5 años (0-100)" },
        firmness: { type: "number", description: "Proyección de firmeza a 5 años (0-100)" },
        luminosity: { type: "number", description: "Proyección de luminosidad a 5 años (0-100)" },
        sensitivity: { type: "number", description: "Proyección de sensibilidad a 5 años (0-100)" },
      },
      required: ["hydration", "texture", "firmness", "luminosity", "sensitivity"],
    },
    trends: {
      type: "object",
      properties: {
        hydration: { type: "string", enum: ["improving", "stable", "declining"] },
        texture: { type: "string", enum: ["improving", "stable", "declining"] },
        firmness: { type: "string", enum: ["improving", "stable", "declining"] },
        luminosity: { type: "string", enum: ["improving", "stable", "declining"] },
        sensitivity: { type: "string", enum: ["improving", "stable", "declining"] },
      },
      required: ["hydration", "texture", "firmness", "luminosity", "sensitivity"],
    },
    keyFactors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          factor: { type: "string" },
          impact: { type: "string", enum: ["high", "medium", "low"] },
          description: { type: "string" },
        },
        required: ["factor", "impact", "description"],
      },
      description: "Factores clave que más afectan la evolución de la piel",
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          priority: { type: "string", enum: ["essential", "important", "optional"] },
          category: { type: "string", enum: ["hydration", "protection", "treatment", "lifestyle"] },
          title: { type: "string" },
          description: { type: "string" },
          ingredients: {
            type: "array",
            items: { type: "string" },
            description: "Ingredientes activos específicos recomendados",
          },
        },
        required: ["priority", "category", "title", "description", "ingredients"],
      },
      description: "Recomendaciones personalizadas con ingredientes activos",
    },
  },
  required: [
    "summary",
    "currentScore",
    "fiveYearProjection",
    "trends",
    "keyFactors",
    "recommendations",
  ],
  additionalProperties: false,
}

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

Provide your analysis in the exact JSON structure specified.`
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

Proporciona tu análisis en la estructura JSON exacta especificada.`

        safeSend({ stage: "processing", message: "Generando predicción con IA..." })

        const apiBody = {
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          stream: true,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "aging_prediction",
              strict: true,
              schema: AGING_OUTPUT_SCHEMA,
            },
          },
        }

        logger.info("Aging prediction stream started", {
          userId: session.user.id,
          analysisId: analysis.id,
          ragIngredients: matched.length,
        })

        const res = await withRetry(
          () =>
            fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getApiKey()}`,
              },
              body: JSON.stringify(apiBody),
              signal: AbortSignal.timeout(90000),
            }),
          { maxRetries: 2, baseDelayMs: 2000 }
        )

        if (!res.ok) {
          const text = await res.text()
          logger.error("Aging prediction stream OpenRouter error", { status: res.status, text })
          throw new Error(`OpenRouter error ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body from OpenRouter")

        const decoder = new TextDecoder()
        let fullContent = ""
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data: ")) continue

            const payload = trimmed.slice(6)
            if (payload === "[DONE]") continue

            try {
              const parsed = JSON.parse(payload)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                fullContent += delta
                safeSend({
                  stage: "processing",
                  message: "Generando predicción con IA...",
                  text: delta,
                  length: fullContent.length,
                })
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        if (!fullContent) throw new Error("No response from AI stream")

        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(fullContent)
        } catch {
          throw new Error("La IA devolvió una respuesta inválida. Intenta de nuevo.")
        }

        const prediction = sanitizePrediction(parsed)

        logger.info("Aging prediction stream completed", {
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
          } catch {
            // stream already closed
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        logger.error("Aging prediction stream failed", { error: msg })

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
