"use client"

import { useMemo } from "react"

const seasons = [
  {
    name: "verano",
    months: [12, 1, 2],
    message: "El calor aumenta el brillo facial. Analiza tu piel ahora.",
  },
  {
    name: "otoño",
    months: [3, 4, 5],
    message: "Los cambios de temperatura afectan tu piel. Descubre cómo está.",
  },
  {
    name: "invierno",
    months: [6, 7, 8],
    message: "El frío reseca la piel. Descubre cómo está la tuya.",
  },
  {
    name: "primavera",
    months: [9, 10, 11],
    message: "La primavera renueva tu piel. Analiza tu rutina.",
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
