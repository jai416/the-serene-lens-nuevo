import { AnalysisRepository } from "@/lib/repositories"

interface EvolutionPoint {
  date: string
  texture?: string
  shine?: string
  pores?: string
  uniformity?: string
  apparentSensitivity?: string
  apparentOil?: string
}

const SEVERITY_ORDER = ["bajo", "leve", "moderado", "visible", "alto"] as const
type Severity = typeof SEVERITY_ORDER[number]

function severityToNumber(val: string | undefined | null): number {
  if (!val) return -1
  const v = val.toLowerCase().trim()
  const idx = SEVERITY_ORDER.indexOf(v as Severity)
  return idx >= 0 ? idx : -1
}

export interface EvolutionResult {
  points: EvolutionPoint[]
  trends: Record<string, "improving" | "stable" | "worsening" | "insufficient_data">
  firstAnalysis: EvolutionPoint | null
  latestAnalysis: EvolutionPoint | null
  totalAnalyses: number
}

export async function getSkinEvolution(userId: string): Promise<EvolutionResult> {
  const analyses = await AnalysisRepository.findEvolution(userId)

  if (analyses.length === 0) {
    return { points: [], trends: {}, firstAnalysis: null, latestAnalysis: null, totalAnalyses: 0 }
  }

  const points: EvolutionPoint[] = analyses.map((a) => {
    let obs: Record<string, string> = {}
    try {
      obs = typeof a.observations === "string" ? JSON.parse(a.observations) : a.observations
    } catch {
      obs = {}
    }

    return {
      date: a.createdAt.toISOString().split("T")[0],
      texture: obs.texture,
      shine: obs.shine,
      pores: obs.pores,
      uniformity: obs.uniformity,
      apparentSensitivity: obs.apparentSensitivity,
      apparentOil: obs.apparentOil,
    }
  })

  if (points.length < 2) {
    return {
      points,
      trends: {
        texture: "insufficient_data",
        shine: "insufficient_data",
        pores: "insufficient_data",
        uniformity: "insufficient_data",
        apparentSensitivity: "insufficient_data",
        apparentOil: "insufficient_data",
      },
      firstAnalysis: points[0] || null,
      latestAnalysis: points[points.length - 1] || null,
      totalAnalyses: points.length,
    }
  }

  const categories = ["texture", "shine", "pores", "uniformity", "apparentSensitivity", "apparentOil"] as const
  const trends: Record<string, "improving" | "stable" | "worsening" | "insufficient_data"> = {}

  for (const cat of categories) {
    const values = points.map((p) => severityToNumber((p as Record<string, unknown>)[cat] as number)).filter((v) => v >= 0)
    if (values.length < 2) {
      trends[cat] = "insufficient_data"
      continue
    }

    const first = values[0]
    const last = values[values.length - 1]
    const diff = last - first

    if (Math.abs(diff) <= 1) {
      trends[cat] = "stable"
    } else if (diff < 0) {
      trends[cat] = "improving"
    } else {
      trends[cat] = "worsening"
    }
  }

  return {
    points,
    trends,
    firstAnalysis: points[0],
    latestAnalysis: points[points.length - 1],
    totalAnalyses: points.length,
  }
}

export async function getUserEvolution(userId: string) {
  try {
    const { getCachedEvolution } = await import("./evolution-calculator")
    const cached = await getCachedEvolution(userId)
    if (cached && cached.totalAnalyses > 0) return cached
  } catch (e) { logger.error("Cache evolution failed", { error: e }) }
  const fresh = await getSkinEvolution(userId)
  try {
    const { recalculateAndSaveEvolution } = await import("./evolution-calculator")
    await recalculateAndSaveEvolution(userId)
  } catch (e) { logger.error("Recalculate evolution failed", { error: e }) }
  return fresh
}
