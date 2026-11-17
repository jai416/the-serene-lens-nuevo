/**
 * Forma canónica de los datos de un análisis.
 *
 * PROBLEMA QUE RESUELVE: la columna `SkinAnalysis.observations` se guardaba
 * como un array plano de strings, pero la mitad de los consumidores
 * (página de resultados, evolución, insignias, informes) la leen como un
 * objeto con métricas (textura, poros, brillo...) y la otra mitad como array.
 * Resultado: la página mostraba "No determinada / 0 categorías" y un resumen
 * hardcodeado, y el gráfico de evolución nunca tenía datos.
 *
 * FORMA CANÓNICA (JSON en la columna `observations`):
 * {
 *   v: 2,
 *   skinType: string | null,
 *   observations: string[],              // lista de hallazgos en texto
 *   texture, shine, pores, uniformity,   // métricas por categoría (etiquetas:
 *   apparentSensitivity, apparentOil,    //  Bajo | Leve | Moderado | Visible | Alto)
 *   confidence, confidenceReason,
 *   resumenGeneral, observationExplanations, factors, routine, ...
 * }
 *
 * `parseObservations` tolera los formatos antiguos (array plano u objeto
 * legacy) para que los análisis ya guardados sigan leyéndose.
 */

export const OBSERVATIONS_VERSION = 2

export const SEVERITY_CATEGORIES = [
  "texture",
  "shine",
  "pores",
  "uniformity",
  "apparentSensitivity",
  "apparentOil",
] as const

export type SeverityCategory = (typeof SEVERITY_CATEGORIES)[number]

export interface ParsedObservations {
  /** Lista de hallazgos en texto (legado: array plano; canónico: observations[]) */
  list: string[]
  /** Objeto plano con métricas y campos extra (vacío en formato legado array) */
  data: Record<string, unknown>
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>
        const detalle = obj.detalle ?? obj.detail ?? obj.description ?? obj.label
        if (typeof detalle === "string") return detalle
        return JSON.stringify(item)
      }
      return String(item)
    })
    .filter(Boolean)
}

/**
 * Normaliza cualquier formato de `observations` (string JSON, array u objeto).
 */
export function parseObservations(raw: unknown): ParsedObservations {
  let parsed: unknown = raw

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }
  }

  // Legacy: array plano de strings
  if (Array.isArray(parsed)) {
    return { list: toTextList(parsed), data: {} }
  }

  if (parsed && typeof parsed === "object") {
    const data = parsed as Record<string, unknown>
    return { list: toTextList(data.observations), data }
  }

  return { list: [], data: {} }
}

/** Devuelve la etiqueta de severidad de una categoría ("" si no existe). */
export function getSeverity(data: Record<string, unknown>, category: SeverityCategory): string {
  const value = data[category]
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

/**
 * Construye el JSON canónico que se guarda en la columna `observations`.
 * `result` es la respuesta cruda de la IA (ya normalizada a claves inglesas
 * donde aplica) y `normalized` son los campos ya normalizados por el service.
 */
export function buildObservations(
  result: Record<string, unknown>,
  normalized: {
    skinType: string | null
    observations: string[]
    recommendations: string[]
    routine: unknown
  }
): string {
  return JSON.stringify({
    ...result,
    v: OBSERVATIONS_VERSION,
    skinType: normalized.skinType,
    observations: normalized.observations,
    recommendations: normalized.recommendations,
    routine: normalized.routine,
  })
}

/** Vista plana que consumen las páginas de resultados y comparativas. */
export interface AnalysisView {
  skinType: string
  texture: string
  pores: string
  shine: string
  uniformity: string
  apparentSensitivity: string
  apparentOil: string
  observations: string[]
  recommendations: string[]
  confidence: string
  confidenceReason: string
  resumenGeneral: string
  observationExplanations: Record<string, string>
  routine: { morning: string[]; evening: string[] }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string")
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []
    } catch {
      return []
    }
  }
  return []
}

function stringRecord(value: unknown): Record<string, string> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v
    }
    return out
  }
  if (typeof value === "string") {
    try {
      return stringRecord(JSON.parse(value))
    } catch {
      return {}
    }
  }
  return {}
}

function routineOf(value: unknown): { morning: string[]; evening: string[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { morning: [], evening: [] }
  }
  const obj = value as Record<string, unknown>
  return {
    morning: stringList(obj.morning ?? obj.manana),
    evening: stringList(obj.evening ?? obj.noche),
  }
}

/**
 * Convierte cualquier formato de `observations` en la vista que usan las UI.
 * Centraliza el parseo para que resultados y comparativas no diverjan.
 */
export function toAnalysisView(
  rawObservations: unknown,
  options?: { skinType?: string | null; recommendations?: unknown }
): AnalysisView {
  const { list, data } = parseObservations(rawObservations)

  const rawRecommendations = options?.recommendations ?? data.recommendations

  return {
    skinType: text(options?.skinType) || text(data.skinType) || text(data.tipoDePiel),
    texture: text(data.texture),
    pores: text(data.pores),
    shine: text(data.shine),
    uniformity: text(data.uniformity),
    apparentSensitivity: text(data.apparentSensitivity),
    apparentOil: text(data.apparentOil),
    observations: list,
    recommendations: stringList(rawRecommendations),
    confidence: text(data.confidence) || "media",
    confidenceReason: text(data.confidenceReason),
    resumenGeneral: text(data.resumenGeneral) || text(data.summary),
    observationExplanations: stringRecord(data.observationExplanations),
    routine: routineOf(data.routine ?? data.rutina),
  }
}
