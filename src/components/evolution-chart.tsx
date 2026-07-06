"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface EvolutionPoint {
  date: string
  texture?: string
  shine?: string
  pores?: string
  uniformity?: string
  apparentSensitivity?: string
  apparentOil?: string
}

interface EvolutionResult {
  points: EvolutionPoint[]
  trends: Record<string, string>
  totalAnalyses: number
}

const CATEGORY_LABELS: Record<string, string> = {
  texture: "Textura",
  shine: "Brillo",
  pores: "Poros",
  uniformity: "Uniformidad",
  apparentSensitivity: "Sensibilidad",
  apparentOil: "Grasa",
}

const TREND_COLORS: Record<string, string> = {
  improving: "#88B078",
  stable: "#E8E8E8",
  worsening: "#FECACA",
  insufficient_data: "#E2ECE0",
}

const TREND_LABELS: Record<string, string> = {
  improving: "Mejorando",
  stable: "Estable",
  worsening: "Empeorando",
  insufficient_data: "Sin datos suficientes",
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full h-2 rounded-full bg-[#E2ECE0] overflow-hidden">
      <div
        className="h-full rounded-full bg-[#88B078] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function EvolutionChart({ data }: { data: EvolutionResult }) {
  if (!data || data.totalAnalyses < 2) {
    return (
      <Card className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-[#1A1A1A]">
            <TrendingUp className="w-5 h-5" />
            Evolución de tu Piel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-sm text-[#666666]">
            {data.totalAnalyses === 0
              ? "Aún no tienes análisis. Realiza tu primer análisis para comenzar a ver tu evolución."
              : "Realiza al menos 2 análisis para comenzar a ver tendencias en tu evolución."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-[#1A1A1A]">
          <TrendingUp className="w-5 h-5" />
          Evolución de tu Piel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-xs text-[#666666] mb-4">
          Basado en {data.totalAnalyses} análisis · {data.points?.[0]?.date} → {data.points?.[data.points.length - 1]?.date}
        </p>
        <div className="space-y-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const trend = data.trends?.[key] || "insufficient_data"
            const values = (data.points || []).map((p) => (p as any)[key]).filter(Boolean)
            const maxSeverity = 4

            return (
              <div key={key} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8F9FA] transition-colors">
                <div className="w-24 shrink-0">
                  <p className="text-xs text-[#666666]">{label}</p>
                </div>
                <div className="flex-1">
                  {values.length > 0 && (
                    <MiniBar value={values.length} max={maxSeverity + 1} />
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TREND_COLORS[trend] || "#E2ECE0" }}
                  />
                  <span className="text-[10px] text-[#666666]">{TREND_LABELS[trend] || "—"}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
