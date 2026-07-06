"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Loader2, TrendingUp, Calendar, Droplets } from "lucide-react"
import dynamic from "next/dynamic"

const SkinReportDownload = dynamic(
  () => import("@/components/pdf-skin-report").then((mod) => mod.SkinReportDownload),
  { ssr: false, loading: () => <Loader2 className="w-4 h-4 animate-pulse" /> }
)

interface AnalysisData {
  id: string
  createdAt: string
  skinType?: string | null
  observations: string[]
  recommendations: string[]
  routine?: string | null
  concerns?: string | null
}

interface MonthlyComparison {
  hasData: boolean
  current?: { month: string; count: number; latest: AnalysisData | null }
  previous?: { month: string; count: number; latest: AnalysisData | null }
  changes: string[]
  summary: string
}

interface DynamicRoutine {
  hasData: boolean
  skinType: string
  season: string
  seasonName: string
  routine: { morning: string[]; evening: string[]; weekly: string[] }
  seasonAdjustments: string[]
  notes: string
}

export default function ReportPage() {
  const { data: session, status } = useSession()
  const [analyses, setAnalyses] = useState<AnalysisData[]>([])
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null)
  const [routine, setRoutine] = useState<DynamicRoutine | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch("/api/analysis").then((r) => r.json()),
        fetch("/api/user/monthly-comparison").then((r) => r.json()),
        fetch("/api/user/dynamic-routine").then((r) => r.json()),
      ])
        .then(([analysisData, compData, routineData]) => {
          const a = analysisData?.data?.analyses || analysisData?.analyses || []
          setAnalyses(a.map((x: Record<string, unknown>) => ({
            id: x.id as string,
            createdAt: x.createdAt as string,
            skinType: x.skinType as string | null,
            observations: JSON.parse((x.observations as string) || "[]"),
            recommendations: JSON.parse((x.recommendations as string) || "[]"),
            routine: x.routine as string | null,
            concerns: x.concerns as string | null,
          })))
          setComparison(compData?.data || compData)
          setRoutine(routineData?.data || routineData)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-pulse text-[#88B078]" />
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=/dashboard/report")

  const plan = session.user.plan || "FREE"
  const isProPlus = plan === "PRO_PLUS"

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <FileText className="w-3.5 h-3.5 mr-2" />
            Informe y Rutina
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
            Tu Informe Personalizado
          </h1>
          <p className="text-[#666666] mt-2">
            Resumen de tu evolución, rutina dinámica y comparativa mensual.
          </p>
        </div>

        {/* PDF Download */}
        {isProPlus && analyses.length > 0 && (
          <Card className="p-6 mb-6 ring-1 ring-[#88B078]">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#1A1A1A] flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Informe PDF Completo
                  </h3>
                  <p className="text-sm text-[#666666] mt-1">
                    Descarga tu informe con evolución, rutina y comparativa mensual.
                  </p>
                </div>
                <SkinReportDownload
                  userName={session.user.name || "Usuario"}
                  analyses={analyses}
                  evolution={null}
                  monthlyComparison={comparison?.hasData ? {
                    current: comparison.current?.month || "",
                    previous: comparison.previous?.month || "",
                    changes: comparison.changes,
                  } : null}
                  dynamicRoutine={routine?.hasData ? {
                    morning: routine.routine.morning,
                    evening: routine.routine.evening,
                    weekly: routine.routine.weekly,
                    notes: routine.notes,
                  } : null}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {!isProPlus && (
          <Card className="p-6 mb-6">
            <CardContent className="p-0">
              <div className="text-center py-4">
                <FileText className="w-10 h-10 text-[#E8E8E8] mx-auto mb-3" />
                <h3 className="font-medium text-[#1A1A1A] mb-1">Informe PDF</h3>
                <p className="text-sm text-[#666666] mb-3">
                  Disponible con plan Pro+ ($14.99/mes)
                </p>
                <a href="/pricing" className="text-sm text-[#88B078] hover:underline">
                  Ver planes →
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Comparison */}
        {comparison?.hasData && (
          <Card className="p-6 mb-6">
            <CardContent className="p-0">
              <h3 className="font-medium text-sm mb-4 flex items-center gap-2 text-[#1A1A1A]">
                <Calendar className="w-4 h-4" />
                Comparativa Mensual
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-[#E2ECE0]">
                  <p className="text-xs text-[#666666]">{comparison.previous?.month}</p>
                  <p className="text-lg font-semibold text-[#1A1A1A]">{comparison.previous?.count || 0} análisis</p>
                </div>
                <div className="p-3 rounded-xl bg-[#88B078]/20">
                  <p className="text-xs text-[#666666]">{comparison.current?.month}</p>
                  <p className="text-lg font-semibold text-[#1A1A1A]">{comparison.current?.count || 0} análisis</p>
                </div>
              </div>
              {comparison.changes.length > 0 && (
                <div className="space-y-2">
                  {comparison.changes.map((change, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-[#88B078] mt-0.5 flex-shrink-0" />
                      <span className="text-[#1A1A1A]">{change}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-[#666666] mt-3">{comparison.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Dynamic Routine */}
        {routine?.hasData && (
          <Card className="p-6 mb-6">
            <CardContent className="p-0">
              <h3 className="font-medium text-sm mb-4 flex items-center gap-2 text-[#1A1A1A]">
                <Droplets className="w-4 h-4" />
                Rutina Dinámica — {routine.seasonName}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-[#666666] mb-2">MAÑANA</p>
                  <ol className="space-y-1">
                    {routine.routine.morning.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                        <span className="w-5 h-5 rounded-full bg-[#88B078] text-[#1A1A1A] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#666666] mb-2">NOCHE</p>
                  <ol className="space-y-1">
                    {routine.routine.evening.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                        <span className="w-5 h-5 rounded-full bg-[#88B078] text-[#1A1A1A] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                {routine.routine.weekly.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#666666] mb-2">SEMANAL</p>
                    <ul className="space-y-1">
                      {routine.routine.weekly.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                          <span className="text-[#88B078]">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {routine.seasonAdjustments.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#FFF9E6]/30">
                    <p className="text-xs font-medium text-[#666666] mb-2">Ajustes de temporada:</p>
                    <ul className="space-y-1">
                      {routine.seasonAdjustments.map((adj, i) => (
                        <li key={i} className="text-xs text-[#1A1A1A]">• {adj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#666666] mt-3">{routine.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Latest Analysis */}
        {analyses.length > 0 && (
          <Card className="p-6">
            <CardContent className="p-0">
              <h3 className="font-medium text-sm mb-4 flex items-center gap-2 text-[#1A1A1A]">
                <TrendingUp className="w-4 h-4" />
                Último Análisis
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Tipo de piel:</span>
                  <span className="font-medium text-[#1A1A1A]">{analyses[0].skinType || "No determinado"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Fecha:</span>
                  <span className="text-[#1A1A1A]">{new Date(analyses[0].createdAt).toLocaleDateString("es-ES")}</span>
                </div>
                {analyses[0].observations.length > 0 && (
                  <div>
                    <p className="text-xs text-[#666666] mb-1">Observaciones:</p>
                    <ul className="space-y-1">
                      {analyses[0].observations.slice(0, 3).map((obs, i) => (
                        <li key={i} className="text-xs text-[#1A1A1A]">• {obs}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {analyses.length === 0 && !comparison?.hasData && (
          <Card className="p-8">
            <CardContent className="p-0 text-center">
              <FileText className="w-12 h-12 text-[#E8E8E8] mx-auto mb-4" />
              <h3 className="font-medium text-[#1A1A1A] mb-2">Sin datos aún</h3>
              <p className="text-sm text-[#666666] mb-4">
                Realiza tu primer análisis para ver tu informe personalizado.
              </p>
              <a href="/analysis" className="text-sm text-[#88B078] hover:underline">
                Comenzar análisis →
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
