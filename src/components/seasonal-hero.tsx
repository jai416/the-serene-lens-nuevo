"use client"

import { useMemo } from "react"

// Tropical seasons for Cuba (Northern Hemisphere):
// Seca/fresca: Noviembre - Abril (menos lluvia, temperaturas más suaves)
// Lluviosa/caliente: Mayo - Octubre (alta humedad, calor intenso, UV extremo)
const seasons = [
  {
    name: "lluviosa",
    months: [5, 6, 7, 8, 9, 10],
    message: "🌧️ Temporada lluviosa — la humedad y el calor intenso aumentan el brillo facial y los poros dilatados. Prioriza texturas ligeras y protección solar estricta.",
  },
  {
    name: "seca",
    months: [11, 12, 1, 2, 3, 4],
    message: "☀️ Temporada seca — el sol está más fuerte y el ambiente más seco. Mantén la hidratación ligera y no olvides el protector solar a diario.",
  },
]

function getSeasonMessage(): string {
  const now = new Date()
  const month = now.getMonth() + 1

  for (const season of seasons) {
    if (season.months.includes(month)) {
      return season.message
    }
  }

  return seasons[0].message
}

export function SeasonalHero() {
  const message = useMemo(() => getSeasonMessage(), [])

  return (
    <div
      className="rounded-[20px] px-4 py-3 text-center text-sm font-medium text-[#1A1A1A]"
      style={{ backgroundColor: "#FFF9E6" }}
    >
      {message}
    </div>
  )
}
