import { analyzeSkin } from "@/lib/openrouter"
import { checkAndDeductUsage } from "@/lib/usage"
import { AnalysisRepository } from "@/lib/repositories"

export const AnalysisService = {
  async processAnalysis(userId: string, files: File[], body: Record<string, string>) {
    const usage = await checkAndDeductUsage(userId)
    if (!usage.allowed) {
      throw new Error(usage.error || "Límite de análisis alcanzado")
    }

    const imagesBase64 = await Promise.all(
      files.map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Una imagen supera los 10MB")
        }
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        return buffer.toString("base64")
      })
    )

    const result = await analyzeSkin({
      imagesBase64,
      concerns: body.concerns || undefined,
      age: body.age || undefined,
      gender: body.gender || undefined,
      climate: body.climate || undefined,
      routine: body.routine || undefined,
      language: body.language || undefined,
    })

    const analysis = await AnalysisRepository.create({
      userId,
      skinType: result.skinType || null,
      concerns: body.concerns || null,
      observations: JSON.stringify(result.observations || []),
      recommendations: JSON.stringify(result.recommendations || []),
      routine: result.routine ? JSON.stringify(result.routine) : null,
    })

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
