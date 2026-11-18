import { describe, it, expect } from "vitest"
import { formatResult } from "@/lib/telegram-analyze"

describe("formatResult (funnel de Telegram)", () => {
  it("formatea el resultado completo con CTA de registro", () => {
    const out = formatResult({
      tipoDePiel: "Mixta con tendencia a brillo en zona T",
      resumenGeneral: "Tu piel se ve equilibrada con algo de brillo en la zona T.",
      observations: [
        { zona: "Frente", detalle: "Poros visibles", severidad: "Leve" },
        { zona: "Mejillas", detalle: "Ligera rojez", severidad: "Moderado" },
      ],
      recomendaciones: ["Limpieza doble por la noche", "Protector solar diario"],
      rutina: {
        manana: ["Limpiador suave", "Sérum de niacinamida", "Protector solar"],
        noche: ["Doble limpieza", "Hidratante ligero"],
      },
    })

    expect(out).toContain("Tu análisis de piel está listo")
    expect(out).toContain("Mixta con tendencia a brillo en zona T")
    expect(out).toContain("Poros visibles")
    expect(out).toContain("Limpieza doble por la noche")
    expect(out).toContain("Rutina de mañana")
    expect(out).toContain("Rutina de noche")
    // El CTA es el objetivo del embudo
    expect(out).toContain("Guarda tu resultado")
    expect(out).toContain("/register")
    expect(out).toContain("from=telegram")
  })

  it("acepta el shape en inglés (normalizeAnalysisResult)", () => {
    const out = formatResult({
      skinType: "Seca",
      summary: "Piel seca con tirantez.",
      observations: ["Tirantez en mejillas"],
      recommendations: ["Usar crema hidratante"],
      routine: { morning: ["Hidratante"], evening: ["Aceite"] },
    })

    expect(out).toContain("Seca")
    expect(out).toContain("Tirantez en mejillas")
    expect(out).toContain("Usar crema hidratante")
    expect(out).toContain("Hidratante")
    expect(out).toContain("Aceite")
  })

  it("no rompe con un resultado vacío", () => {
    const out = formatResult({})
    expect(out).toContain("Tu análisis de piel está listo")
    expect(out).toContain("Guarda tu resultado")
    expect(out).not.toContain("undefined")
    expect(out).not.toContain("[object Object]")
  })

  it("limita las listas para no romper el mensaje de Telegram (4096)", () => {
    const out = formatResult({
      observations: Array.from({ length: 30 }, (_, i) => ({
        zona: `Zona ${i}`,
        detalle: `Observación ${i}`,
        severidad: "Leve",
      })),
      recomendaciones: Array.from({ length: 30 }, (_, i) => `Recomendación ${i}`),
    })
    expect(out.length).toBeLessThan(4096)
    expect(out).toContain("Observación 0")
  })
})
