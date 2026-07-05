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
import { ListSkeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Analysis {
  id: string
  skinType: string | null
  concerns: string | null
  createdAt: string
}

interface EvolutionResult {
  points: any[]
  trends: Record<string, string>
  totalAnalyses: number
}

export default function HistoryPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [evolution, setEvolution] = useState<EvolutionResult | null>(null)
  const [evolutionLoading, setEvolutionLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    if (session) {
      fetch("/api/analysis", { signal: controller.signal })
        .then((res) => res.ok ? res.json() : { analyses: [] })
        .then((data) => setAnalyses(data?.data?.analyses || data.analyses || []))
        .catch(() => toast.error("Error al cargar historial"))
    }
    return () => controller.abort()
  }, [session])

  useEffect(() => {
    const controller = new AbortController()
    if (session) {
      fetch("/api/user/evolution", { signal: controller.signal })
        .then((res) => res.ok ? res.json() : null)
        .then((d) => setEvolution(d?.data || d))
        .catch(() => toast.error("Error al cargar datos"))
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

  const showEvolution = (session.user as any).plan !== "FREE" && evolution && !evolutionLoading

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <History className="w-3.5 h-3.5 mr-2" />
            Historial
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D3229]">
            Mi Historial
          </h1>
        </div>

        {showEvolution && <div className="mb-8"><EvolutionChart data={evolution} /></div>}

        {analyses.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <div className="w-14 h-14 rounded-2xl bg-[#E8D5C4] flex items-center justify-center mx-auto mb-4">
                <Scan className="w-6 h-6 text-[#3D3229]" />
              </div>
              <p className="text-[#8A7A6A] mb-4">No tienes análisis guardados aún.</p>
              <Link href="/analysis">
                <span className="text-[#3D3229] text-sm font-medium hover:underline cursor-pointer">
                  Haz tu primer análisis
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
                      <div className="w-10 h-10 rounded-xl bg-[#F0F5EC] flex items-center justify-center flex-shrink-0">
                        <Scan className="w-4 h-4 text-[#3D3229]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#3D3229]">
                          Análisis {a.skinType ? `- Piel ${a.skinType}` : ""}
                        </p>
                        <p className="text-xs text-[#8A7A6A]">{formatDate(a.createdAt)}</p>
                        {a.concerns && (
                          <p className="text-xs text-[#8A7A6A] mt-0.5 truncate max-w-[200px] sm:max-w-sm">
                            {a.concerns}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#A89888] group-hover:text-[#3D3229] transition-colors" />
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
