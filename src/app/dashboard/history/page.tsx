"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Scan, ArrowRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Analysis {
  id: string
  skinType: string | null
  concerns: string | null
  createdAt: string
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const [analyses, setAnalyses] = useState<Analysis[]>([])

  useEffect(() => {
    if (session) {
      fetch("/api/analysis")
        .then((res) => res.ok ? res.json() : { analyses: [] })
        .then((data) => setAnalyses(data.analyses || []))
        .catch(() => toast.error("Error al cargar historial"))
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!session) redirect("/api/auth/signin")

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Badge variant="neon" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <History className="w-3.5 h-3.5 mr-2" />
            Historial
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
            Mi <span className="gradient-text">Historial</span>
          </h1>
        </div>

        {analyses.length === 0 ? (
          <div className="text-center py-16 glass-card p-8">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 neon-glow">
              <Scan className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="text-on-surface-variant mb-4">No tienes análisis guardados aún.</p>
            <Link href="/analysis">
              <span className="text-primary text-sm font-medium hover:underline cursor-pointer">
                Haz tu primer análisis
              </span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((a) => (
              <Link key={a.id} href={`/analysis/results/${a.id}`}>
                <Card className="border-[rgba(255,255,255,0.25)] transition-all duration-200 group">
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Scan className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Análisis {a.skinType ? `- Piel ${a.skinType}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
                        {a.concerns && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px] sm:max-w-sm">
                            {a.concerns}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
