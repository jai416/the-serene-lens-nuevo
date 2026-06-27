import { analyzeSkin } from "@/lib/openrouter"
import { ImageCompressionError } from "@/lib/image-compression"
import { checkAndDeductUsage } from "@/lib/usage"
import { AnalysisRepository } from "@/lib/repositories"

export class AnalysisError extends Error {
  constructor(
    message: string,
    public code: "VALIDATION" | "USAGE_LIMIT" | "COMPRESSION" | "AI_ERROR" | "DB_ERROR" | "UNKNOWN",
    public cause?: unknown
  ) {
    super(message)
    this.name = "AnalysisError"
  }
}

export const AnalysisService = {
  async processAnalysis(userId: string, files: File[], body: Record<string, string>) {
    const usage = await checkAndDeductUsage(userId)
    if (!usage.allowed) {
      throw new AnalysisError(usage.error || "Límite de análisis alcanzado", "USAGE_LIMIT")
    }

    const imagesBase64 = await Promise.all(
      files.map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new AnalysisError("Una imagen supera los 10MB. Reduce el tamaño o toma una foto con menor resolución.", "VALIDATION")
        }

        let buffer: Buffer
        try {
          const bytes = await file.arrayBuffer()
          buffer = Buffer.from(bytes)
        } catch {
          throw new AnalysisError("No se pudo leer el archivo de imagen. Inténtalo de nuevo.", "VALIDATION")
        }

        const base64 = buffer.toString("base64")
        if (!base64) {
          throw new AnalysisError("La imagen parece estar corrupta o vacía. Toma una nueva foto.", "VALIDATION")
        }

        return base64
      })
    )

    let result: Record<string, unknown>
    try {
      result = await analyzeSkin({
        imagesBase64,
        concerns: body.concerns || undefined,
        age: body.age || undefined,
        gender: body.gender || undefined,
        climate: body.climate || undefined,
        routine: body.routine || undefined,
        language: body.language || undefined,
      })
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes("OpenRouter error 429")) {
          throw new AnalysisError("Demasiadas solicitudes. Espera un momento e intenta de nuevo.", "AI_ERROR", e)
        }
        if (e.message.includes("OpenRouter error 401")) {
          throw new AnalysisError("Error de autenticación con el servicio de IA. Contacta al soporte.", "AI_ERROR", e)
        }
        if (e.message.includes("OpenRouter error 5")) {
          throw new AnalysisError("El servicio de IA no está disponible temporalmente. Intenta más tarde.", "AI_ERROR", e)
        }
        if (e.message.includes("timeout") || e.message.includes("AbortError")) {
          throw new AnalysisError("La solicitud tardó demasiado. Intenta con menos fotos o más tarde.", "AI_ERROR", e)
        }
        if (e.message.includes("No response from AI")) {
          throw new AnalysisError("La IA no pudo generar un análisis. Intenta con fotos más claras.", "AI_ERROR", e)
        }
        if (e.message.includes("invalid response")) {
          throw new AnalysisError("La IA devolvió una respuesta inesperada. Intenta de nuevo.", "AI_ERROR", e)
        }
      }
      throw new AnalysisError("Error al analizar la imagen. Intenta de nuevo.", "AI_ERROR", e)
    }

    const skinType = (result as { skinType?: string })?.skinType || null
    const observations = (result as { observations?: string[] })?.observations || []
    const recommendations = (result as { recommendations?: string[] })?.recommendations || []
    const routine = (result as { routine?: { morning?: string[]; evening?: string[] } })?.routine || null

    let analysis
    try {
      analysis = await AnalysisRepository.create({
        userId,
        skinType,
        concerns: body.concerns || null,
        observations: JSON.stringify(observations),
        recommendations: JSON.stringify(recommendations),
        routine: routine ? JSON.stringify(routine) : null,
      })
    } catch (e) {
      throw new AnalysisError("Error al guardar el resultado. El análisis se completó pero no se pudo registrar.", "DB_ERROR", e)
    }

    // Auto-save diary entry after analysis completes
    try {
      const { db } = await import("@/lib/db")

      const scoreFields = [
        (result as Record<string, unknown>)?.texture,
        (result as Record<string, unknown>)?.pores,
        (result as Record<string, unknown>)?.shine,
        (result as Record<string, unknown>)?.uniformity,
        (result as Record<string, unknown>)?.apparentSensitivity,
        (result as Record<string, unknown>)?.apparentOil,
      ]

      const positiveValues = ["uniform", "barely visible", "low", "baja", "uniforme", "poco visibles", "poco visible"]
      const positiveCount = scoreFields.filter((f) => positiveValues.includes(String(f).toLowerCase())).length
      const score = Math.round((positiveCount / scoreFields.length) * 100)

      const topObservations = observations.slice(0, 3).join(", ")
      const notes = `Análisis automático: tipo ${skinType || "desconocido"}, ${topObservations || "sin observaciones destacadas"}`

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await db.skinDiary.upsert({
        where: { userId_date: { userId, date: today } },
        update: { feeling: score, notes },
        create: { userId, date: today, feeling: score, notes },
      })
    } catch {
      // Diary auto-save is optional — don't break the analysis flow
    }

    return { analysis, result }
  },
}

/**
 * Saves an analysis and triggers evolution recalculation in the background.
 * Does not block the response — evolution is updated asynchronously.
 */
export async function saveAnalysisWithEvolution(
  userId: string,
  data: {
    skinType?: string | null
    concerns?: string | null
    observations: string
    recommendations: string
    routine?: string | null
  }
) {
  const analysis = await AnalysisRepository.create({
    userId,
    skinType: data.skinType || null,
    concerns: data.concerns || null,
    observations: data.observations,
    recommendations: data.recommendations,
    routine: data.routine || null,
  })

  try {
    const { recalculateAndSaveEvolution } = await import("./evolution-calculator")
    recalculateAndSaveEvolution(userId).catch(() => {})
  } catch {
    // evolution update is optional, don't block response
  }

  return analysis
}
