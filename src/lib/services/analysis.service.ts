import { analyzeSkinWithGroq } from "@/lib/groq"
import { checkAndDeductUsage } from "@/lib/usage"
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/analysis-cache"
import { AnalysisRepository } from "@/lib/repositories"
import { logger, getCorrelationId } from "@/lib/logger"
import { getWeather, buildClimateContext } from "@/lib/weather"

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

    const oversized = files.find((f) => f.size > 10 * 1024 * 1024)
    if (oversized) throw new AnalysisError("Una imagen supera los 10MB", "VALIDATION")

    // Fetch previous analysis for contextual AI + weather for real climate data
    let previousSkinType: string | null = null
    let previousObservations: string[] = []
    let climateContext = buildClimateContext(null, null, body.climate)
    try {
      const { db } = await import("@/lib/db")
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { latitude: true, longitude: true },
      })
      const previousAnalysis = await db.skinAnalysis.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { skinType: true, observations: true },
      })
      previousSkinType = previousAnalysis?.skinType || null
      previousObservations = previousAnalysis?.observations
        ? (() => { try { return JSON.parse(previousAnalysis.observations) } catch { return [] } })()
        : []
      if (user?.latitude != null && user?.longitude != null) {
        const weather = await getWeather(user.latitude, user.longitude)
        if (weather) {
          climateContext = `Clima actual: ${weather.temp}°C, ${weather.description}. Humedad: ${weather.humidity}%.`
        } else {
          climateContext = buildClimateContext(user.latitude, user.longitude, body.climate)
        }
      }
    } catch {
      // Context enrichment is optional — skip if DB or weather API fails
    }

    // Cache check
    const cacheKeyFiles = files.slice(0, 2)
    const cacheKeyBase64 = (await Promise.all(
      cacheKeyFiles.map(async (f) => {
        const buf = Buffer.from(await f.arrayBuffer())
        return buf.toString("base64").slice(0, 200)
      })
    )).join("|")

    const cached = await getCachedAnalysis([cacheKeyBase64], body.concerns, body.age)
    if (cached) {
      const skinType = (cached as { skinType?: string })?.skinType || null
      const observations = (cached as { observations?: string[] })?.observations || []
      const recommendations = (cached as { recommendations?: string[] })?.recommendations || []
      const routine = (cached as { routine?: { morning?: string[]; evening?: string[] } })?.routine || null

      const analysis = await AnalysisRepository.create({
        userId,
        skinType,
        concerns: body.concerns || null,
        observations: JSON.stringify(observations),
        recommendations: JSON.stringify(recommendations),
        routine: routine ? JSON.stringify(routine) : null,
      })

      return { analysis, result: cached }
    }

    let result: Record<string, unknown>
    try {
      result = await analyzeSkinWithGroq(files, {
        age: body.age,
        concerns: body.concerns,
        gender: body.gender,
        climate: climateContext,
        routine: body.routine,
        previousSkinType: previousSkinType,
        previousObservations,
      })
      await setCachedAnalysis([cacheKeyBase64], body.concerns, body.age, result).catch(() => {})
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes("429")) {
        throw new AnalysisError("El servidor de IA está saturado. Espera 30 segundos y vuelve a intentar.", "AI_ERROR", e)
      }
      if (msg.includes("empty response") || msg.includes("invalid JSON")) {
        throw new AnalysisError("La foto no tiene suficiente definición. Asegúrate de tener buena luz y enfocar bien tu rostro.", "AI_ERROR", e)
      }
      if (msg.includes("timeout") || msg.includes("AbortError")) {
        throw new AnalysisError("La conexión tardó demasiado. Revisa tu internet o intenta con menos fotos.", "AI_ERROR", e)
      }
      if (msg.includes("blurry") || msg.includes("dark") || msg.includes("iluminación")) {
        throw new AnalysisError("La foto está oscura o borrosa. Busca buena luz natural y sostén el teléfono firme.", "VALIDATION", e)
      }
      throw new AnalysisError("Error al procesar el análisis. Verifica tu conexión e intenta de nuevo.", "AI_ERROR", e)
    }

    const skinType = (result as { tipoDePiel?: string; skinType?: string })?.tipoDePiel || (result as { skinType?: string })?.skinType || null
    const observationsRaw = (result as { observations?: string | unknown[] })?.observations || []
    const observations = typeof observationsRaw === "string" ? [observationsRaw] : (observationsRaw as { detalle?: string }[]).map((o) => o.detalle || String(o))
    const recommendations = (result as { recomendaciones?: string[]; recommendations?: string[] })?.recomendaciones || (result as { recomendaciones?: string[]; recommendations?: string[] })?.recommendations || []
    const routineRaw = (result as { rutina?: { manana?: string[]; noche?: string[] }; routine?: { morning?: string[]; evening?: string[] } })?.rutina
    const routine = routineRaw
      ? JSON.parse(JSON.stringify(routineRaw).replace(/"manana"/g, '"morning"').replace(/"noche"/g, '"evening"'))
      : (result as { routine?: { morning?: string[]; evening?: string[] } })?.routine || null

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
        String((result as Record<string, unknown>)?.texture || ""),
        String((result as Record<string, unknown>)?.pores || ""),
        String((result as Record<string, unknown>)?.shine || ""),
        String((result as Record<string, unknown>)?.uniformity || ""),
        String((result as Record<string, unknown>)?.apparentSensitivity || ""),
        String((result as Record<string, unknown>)?.apparentOil || ""),
      ].filter(Boolean)

      const positiveValues = ["uniform", "barely visible", "low", "baja", "uniforme", "poco visibles", "poco visible", "leve", "bajo", "minimo", "mínimo"]
      const normalCount = scoreFields.filter((f) => positiveValues.includes(f.toLowerCase())).length
      const severityValues = ["moderado", "moderate", "visible", "noticeable", "alto", "high", "severo", "severe"]
      const badCount = scoreFields.filter((f) => severityValues.includes(f.toLowerCase())).length
      const score = Math.round(((normalCount - badCount + scoreFields.length) / (scoreFields.length * 2)) * 100)

      const topObservations = observations.slice(0, 3).join(", ")
      const notes = `Análisis automático: tipo ${skinType || "desconocido"}, ${topObservations || "sin observaciones destacadas"}`

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await db.skinDiary.upsert({
        where: { userId_date: { userId, date: today } },
        update: { feeling: score, notes },
        create: { userId, date: today, feeling: score, notes },
      })
    } catch (e) {
      logger.error("Diary auto-save failed", {
        userId,
        skinType,
        error: e instanceof Error ? e.message : String(e),
        correlationId: getCorrelationId() || undefined,
      })
    }

    // Check referral completion after first analysis
    try {
      const { checkAndCompleteReferral } = await import("./group.service")
      await checkAndCompleteReferral(userId)
    } catch (e) {
      logger.error("Referral check failed", {
        userId,
        error: e instanceof Error ? e.message : String(e),
        correlationId: getCorrelationId() || undefined,
      })
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
