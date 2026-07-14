"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

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

const LINE_COLORS = ["#88B078", "#D4A574", "#7BA3C4", "#C47BA0", "#A0C47B", "#C4A07B"]

const SEVERITY_MAP: Record<string, number> = {
  leve: 1,
  moderado: 2,
  visible: 3,
  none: 0,
}

function toNumeric(v: string | undefined): number | null {
  if (!v) return null
  const lower = v.toLowerCase().trim()
  return SEVERITY_MAP[lower] ?? null
}

function TrendBadge({ trend }: { trend: string }) {
  const colors: Record<string, string> = {
    improving: "bg-[#88B078]/20 text-[#88B078]",
    stable: "bg-[#E2ECE0] text-[#666666]",
    worsening: "bg-[#FECACA] text-[#DC2626]",
    insufficient_data: "bg-[#E2ECE0] text-[#9BAA93]",
  }
  const labels: Record<string, string> = {
    improving: "Mejorando",
    stable: "Estable",
    worsening: "Empeorando",
    insufficient_data: "Sin datos",
  }
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colors[trend] || colors.insufficient_data}`}>
      {labels[trend] || labels.insufficient_data}
    </span>
  )
}

export function EvolutionChart({ data }: { data: EvolutionResult }) {
  const chartData = useMemo(() => {
    return (data.points || []).map((p) => {
      const row: Record<string, any> = { date: p.date }
      for (const key of Object.keys(CATEGORY_LABELS)) {
        row[key] = toNumeric((p as any)[key])
      }
      return row
    })
  }, [data])

  if (!data || data.totalAnalyses < 2) {
    return (
      <Card className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-[#1A1A1A]">
            <TrendingUp className="w-5 h-5" />
            Evolucion de tu Piel
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
          Evolucion de tu Piel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-xs text-[#666666] mb-4">
          Basado en {data.totalAnalyses} analisis · {data.points?.[0]?.date} → {data.points?.[data.points.length - 1]?.date}
        </p>

        {/* Line Chart */}
        <div className="h-72 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} />
              <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tickFormatter={(v) => ["None", "Leve", "Moderado", "Visible"][v]} tick={{ fontSize: 10, fill: "#666" }} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [["None", "Leve", "Moderado", "Visible"][value] || value, CATEGORY_LABELS[name] || name]}
              />
              <Legend
                wrapperStyle={{ fontSize: 10 }}
                formatter={(value: string) => CATEGORY_LABELS[value] || value}
              />
              {Object.keys(CATEGORY_LABELS).map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trends Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const trend = data.trends?.[key] || "insufficient_data"
            const firstVal = toNumeric((data.points?.[0] as any)?.[key])
            const lastVal = toNumeric((data.points?.[data.points.length - 1] as any)?.[key])
            const diff = firstVal !== null && lastVal !== null ? lastVal - firstVal : null
            return (
              <div key={key} className="p-2 rounded-xl bg-[#F8F9FA]">
                <p className="text-[10px] text-[#666666]">{label}</p>
                <TrendBadge trend={trend} />
                {diff !== null && diff !== 0 && (
                  <p className={`text-[10px] mt-0.5 ${diff < 0 ? "text-[#88B078]" : "text-[#DC2626]"}`}>
                    {diff < 0 ? `Mejoro ${Math.abs(diff)} nivel` : `Empeoro ${diff} nivel`}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
