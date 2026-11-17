import { describe, it, expect } from "vitest"
import {
  parseObservations,
  buildObservations,
  toAnalysisView,
  OBSERVATIONS_VERSION,
} from "@/lib/analysis-shape"

describe("parseObservations", () => {
  it("tolera el formato legacy (array plano de strings)", () => {
    const { list, data } = parseObservations(JSON.stringify(["Poros visibles", "Ojeras"]))
    expect(list).toEqual(["Poros visibles", "Ojeras"])
    expect(data).toEqual({})
  })

  it("lee el formato canónico (objeto con observations[])", () => {
    const { list, data } = parseObservations(
      JSON.stringify({ v: 2, skinType: "Mixta", observations: ["Textura irregular"], pores: "Leve" })
    )
    expect(list).toEqual(["Textura irregular"])
    expect(data.pores).toBe("Leve")
    expect(data.skinType).toBe("Mixta")
  })

  it("no rompe con datos corruptos", () => {
    expect(parseObservations("no es json").list).toEqual([])
    expect(parseObservations(null).list).toEqual([])
    expect(parseObservations(undefined).data).toEqual({})
  })

  it("extrae el detalle de observaciones en formato objeto", () => {
    const { list } = parseObservations(
      JSON.stringify({ observations: [{ zona: "Frente", detalle: "Poros abiertos", severidad: "Leve" }] })
    )
    expect(list).toEqual(["Poros abiertos"])
  })
})

describe("buildObservations", () => {
  it("guarda la forma canónica con métricas y resumen de la IA", () => {
    const result = {
      resumenGeneral: "Tu piel es mixta con brillo en zona T.",
      tipoDePiel: "Mixta",
      confidence: "Alta",
      texture: "Leve",
      pores: "Visible",
      observations: [{ zona: "Frente", detalle: "Poros", severidad: "Leve" }],
      recomendaciones: ["Usa cleanser suave"],
    }

    const stored = JSON.parse(
      buildObservations(result, {
        skinType: "Mixta con tendencia a brillo en zona T",
        observations: ["Poros"],
        recommendations: ["Usa cleanser suave"],
        routine: { morning: ["Paso 1"], evening: [] },
      })
    )

    expect(stored.v).toBe(OBSERVATIONS_VERSION)
    expect(stored.skinType).toBe("Mixta con tendencia a brillo en zona T")
    expect(stored.texture).toBe("Leve")
    expect(stored.pores).toBe("Visible")
    expect(stored.confidence).toBe("Alta")
    expect(stored.resumenGeneral).toBe("Tu piel es mixta con brillo en zona T.")
    expect(stored.observations).toEqual(["Poros"])
    expect(stored.recommendations).toEqual(["Usa cleanser suave"])
    expect(stored.routine).toEqual({ morning: ["Paso 1"], evening: [] })
  })
})

describe("toAnalysisView", () => {
  it("mapea la forma canónica a la vista de la UI", () => {
    const view = toAnalysisView(
      JSON.stringify({
        v: 2,
        skinType: "Mixta",
        texture: "Leve",
        shine: "Moderado",
        pores: "Visible",
        uniformity: "Leve",
        apparentSensitivity: "Bajo",
        apparentOil: "Moderado",
        confidence: "Alta",
        confidenceReason: "Buena luz",
        resumenGeneral: "Piel mixta.",
        observations: ["Poros visibles"],
        routine: { morning: ["Limpiar"], evening: ["Hidratar"] },
      }),
      { recommendations: ["Usa SPF"] }
    )

    expect(view.skinType).toBe("Mixta")
    expect(view.texture).toBe("Leve")
    expect(view.pores).toBe("Visible")
    expect(view.apparentOil).toBe("Moderado")
    expect(view.confidence).toBe("Alta")
    expect(view.confidenceReason).toBe("Buena luz")
    expect(view.resumenGeneral).toBe("Piel mixta.")
    expect(view.observations).toEqual(["Poros visibles"])
    expect(view.recommendations).toEqual(["Usa SPF"])
    expect(view.routine.morning).toEqual(["Limpiar"])
    expect(view.routine.evening).toEqual(["Hidratar"])
  })

  it("usa el skinType de la columna cuando el análisis es legacy", () => {
    const view = toAnalysisView(JSON.stringify(["Poros", "Ojeras"]), {
      skinType: "Mixta con tendencia a brillo en zona T",
    })
    expect(view.skinType).toBe("Mixta con tendencia a brillo en zona T")
    expect(view.observations).toEqual(["Poros", "Ojeras"])
    // Sin datos legacy de métricas, la vista queda vacía pero no rompe
    expect(view.texture).toBe("")
    expect(view.confidence).toBe("media")
  })
})
