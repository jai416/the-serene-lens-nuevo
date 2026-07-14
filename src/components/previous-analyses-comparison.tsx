"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AIResult {
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
  routine: { morning: string[]; evening: string[] }
}

interface PreviousAnalysis {
  id: string
  createdAt: string
  observations: string
  skinType: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  texture: "Textura",
  shine: "Brillo",
  pores: "Poros",
  uniformity: "Uniformidad",
  apparentSensitivity: "Sensibilidad",
  apparentOil: "Grasa",
}

function parseCategoryValue(obs: string, key: string): string {
  try {
    const parsed = JSON.parse(obs)
    return (parsed[key] || "").toLowerCase()
  } catch {
    return ""
  }
}

function getSeverityScore(value: string): number {
  const map: Record<string, number> = {
    leve: 1,
    bajo: 1,
    moderado: 2,
    visible: 3,
    alto: 4,
  }
  return map[value.toLowerCase()] || 0
}

function TrendIndicator({ current, previous }: { current: string; previous: string }) {
  const currScore = getSeverityScore(current)
  const prevScore = getSeverityScore(previous)

  if (currScore === 0 || prevScore === 0) return null

  if (currScore < prevScore) {
    return <span title="Mejoró"><TrendingUp className="w-4 h-4 text-[#88B078]" /></span>
  }
  if (currScore > prevScore) {
    return <span title="Empeoró"><TrendingDown className="w-4 h-4 text-[#E8A0A0]" /></span>
  }
  return <span title="Estable"><Minus className="w-4 h-4 text-[#666666]" /></span>
}

interface Props {
  currentId: string
  userId: string
  currentResult: AIResult
}

export function PreviousAnalysesComparison({ currentId, userId, currentResult }: Props) {
  const [previous, setPrevious] = useState<PreviousAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrevious = async () => {
      try {
        const res = await fetch(`/api/analysis?userId=${userId}&limit=5`)
        const data = await res.json()
        const analyses = data?.data?.analyses || data?.analyses || []
        const prevAnalyses = analyses
          .filter((a: PreviousAnalysis) => a.id !== currentId)
          .sort((a: PreviousAnalysis, b: PreviousAnalysis) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        if (prevAnalyses.length > 0) {
          setPrevious(prevAnalyses[0])
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchPrevious()
  }, [currentId, userId])

  if (loading) return null
  if (!previous) return null

  const prevObs = previous.observations || "{}"
  const daysDiff = Math.round(
    (new Date(currentResult.skinType === "" ? new Date() : new Date()).getTime() - new Date(previous.createdAt).getTime())
    / (1000 * 60 * 60 * 24)
  )

  const categories = ["texture", "shine", "pores", "uniformity", "apparentSensitivity", "apparentOil"]

  return (
    <Card className="p-6 border-t-4 border-t-[#88B078]">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-[#1A1A1A]">
          <History className="w-5 h-5 text-[#1A1A1A]" />
          Evolución vs. Análisis Anterior
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-4 text-xs text-[#666666]">
          <Clock className="w-3.5 h-3.5" />
          Hace {daysDiff === 0 ? "menos de 1 día" : daysDiff === 1 ? "1 día" : `${daysDiff} días`}
          {` — ${new Date(previous.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`}
        </div>
        <div className="space-y-2">
          {categories.map((key) => {
            const currentVal = (currentResult as Record<string, string>)[key] || ""
            const prevVal = parseCategoryValue(prevObs, key)
            if (!currentVal && !prevVal) return null
            return (
              <div key={key} className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA]">
                <span className="text-sm text-[#666666]">{CATEGORY_LABELS[key]}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#999] line-through">{prevVal || "—"}</span>
                  <TrendIndicator current={currentVal} previous={prevVal} />
                  <span className="text-sm font-medium text-[#1A1A1A] capitalize">{currentVal || "—"}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4">
          <Link href="/dashboard/history">
            <Button variant="outline" size="sm" className="w-full">
              <History className="w-4 h-4 mr-2" />
              Ver evolución completa
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
