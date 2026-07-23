"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Scan, ArrowRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { EvolutionChart } from "@/components/evolution-chart"
import { PreviousAnalysesComparison } from "@/components/previous-analyses-comparison"
import { BadgeDisplay } from "@/components/badge-display"
import { ListSkeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

interface Analysis {
  id: string
  skinType: string | null
  concerns: string | null
  createdAt: string
}

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

export default function HistoryPage() {
  const pathname = usePathname()
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [evolution, setEvolution] = useState<EvolutionResult | null>(null)
  const [evolutionLoading, setEvolutionLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    if (session) {
      fetch("/api/analysis", { signal: controller.signal })
        .then((res) => res.ok ? res.json() : { analyses: [] })
        .then((data) => {
          const raw = data?.data?.analyses || data?.analyses
          setAnalyses(Array.isArray(raw) ? raw : [])
        })
        .catch(() => {})
    }
    return () => controller.abort()
  }, [session])

  useEffect(() => {
    const controller = new AbortController()
    if (session) {
      fetch("/api/user/evolution", { signal: controller.signal })
        .then((res) => res.ok ? res.json() : null)
        .then((d) => {
          const ev = d?.data || d
          if (ev && typeof ev === "object") setEvolution(ev as EvolutionResult)
          else setEvolution(null)
        })
        .catch(() => {})
        .finally(() => setEvolutionLoading(false))
    }
    return () => controller.abort()
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <ListSkeleton rows={5} />
        </div>
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const showEvolution = evolution && !evolutionLoading

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <History className="w-3.5 h-3.5 mr-2" />
            Historial
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
            {t("history.title", locale)}
          </h1>
        </div>

        {showEvolution && (
          <div className="mb-8">
            <EvolutionChart data={evolution} />
            <div className="mt-6">
              <BadgeDisplay />
            </div>
            {session?.user?.id && analyses.length >= 2 && (
              <div className="mt-6">
                <PreviousAnalysesComparison
                  currentId={analyses[0].id}
                  userId={session.user.id}
                />
              </div>
            )}
          </div>
        )}

        {analyses.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <div className="w-14 h-14 rounded-2xl bg-[#88B078] flex items-center justify-center mx-auto mb-4">
                <Scan className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <p className="text-[#666666] mb-4">{t("history.empty", locale)}</p>
              <Link href="/analysis">
                <span className="text-[#1A1A1A] text-sm font-medium hover:underline cursor-pointer">
                  {t("history.startAnalysis", locale)}
                </span>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {analyses.map((a) => (
              <Link key={a.id} href={`/analysis/results/${a.id}`}>
                <Card className="transition-all duration-200 group">
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E2ECE0] flex items-center justify-center flex-shrink-0">
                        <Scan className="w-4 h-4 text-[#1A1A1A]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">
                          {t("history.analysisLabel", locale).replace("{type}", a.skinType || "")}
                        </p>
                        <p className="text-xs text-[#666666]">{formatDate(a.createdAt)}</p>
                        {a.concerns && (
                          <p className="text-xs text-[#666666] mt-0.5 truncate max-w-[200px] sm:max-w-sm">
                            {a.concerns}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#9BAA93] group-hover:text-[#1A1A1A] transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
