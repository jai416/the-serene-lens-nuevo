"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Check, Flame, Calendar, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/lib/csrf-client"
import { errMessage } from "@/lib/api-response"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

interface Challenge {
  id: string
  title: string
  description: string
  points: number
  frequency: string
  completed: boolean
  completedAt: string | null
}

const FREQUENCY_LABELS: Record<string, { es: string; en: string }> = {
  daily: { es: "Diario", en: "Daily" },
  weekly: { es: "Semanal", en: "Weekly" },
  monthly: { es: "Mensual", en: "Monthly" },
}

export default function ChallengesPage() {
  const { locale } = useLocale()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadChallenges = useCallback(async () => {
    try {
      const res = await apiFetch("/api/challenges")
      if (res.ok) {
        const d = await res.json()
        const data = d?.data || d
        setChallenges(data?.challenges || [])
        setTotalPoints(data?.totalPoints || 0)
      }
    } catch {
      toast.error("No se pudieron cargar los desafíos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user) loadChallenges()
  }, [session, loadChallenges])

  if (status === "loading") {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ListSkeleton rows={4} />
        </div>
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const complete = async (id: string) => {
    setBusyId(id)
    try {
      const res = await apiFetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: id }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(errMessage(d, "No se pudo completar el desafío"))
        return
      }
      const result = d?.data || d
      toast.success(result?.message || "¡Desafío completado!")
      await loadChallenges()
    } catch {
      toast.error("No se pudo completar el desafío")
    } finally {
      setBusyId(null)
    }
  }

  const pending = challenges.filter((c) => !c.completed)
  const done = challenges.filter((c) => c.completed)

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "#F8F9FA" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Trophy className="w-3.5 h-3.5 mr-2" />
            {t("challenges.title", locale)}
          </Badge>
          <h1 className="font-serif text-3xl font-semibold mb-2 text-[#1A1A1A]">
            {t("challenges.title", locale)}
          </h1>
          <p className="text-sm text-[#666666]">
            Completa los desafíos, acumula puntos y mantén tu racha.
          </p>
        </div>

        {loading ? (
          <ListSkeleton rows={4} />
        ) : (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5">
                <CardContent className="p-0 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#E2ECE0] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#88B078]" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-[#1A1A1A]">{totalPoints}</p>
                    <p className="text-xs text-[#666666]">Puntos acumulados</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="p-5">
                <CardContent className="p-0 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#E2ECE0] flex items-center justify-center">
                    <Check className="w-5 h-5 text-[#88B078]" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-[#1A1A1A]">{done.length}/{challenges.length}</p>
                    <p className="text-xs text-[#666666]">Completados</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {challenges.length === 0 ? (
              <Card className="p-10 text-center">
                <CardContent className="p-0">
                  <Trophy className="w-10 h-10 text-[#E8E8E8] mx-auto mb-3" />
                  <p className="text-sm text-[#666666]">
                    Todavía no hay desafíos activos. Vuelve pronto.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {pending.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-[#1A1A1A]">Pendientes</h2>
                    {pending.map((c) => (
                      <Card key={c.id} className="p-5">
                        <CardContent className="p-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-[#1A1A1A]">{c.title}</h3>
                                <Badge className="rounded-full px-2 py-0.5 text-[10px] border-0 bg-[#F8F9FA] text-[#666666]">
                                  {FREQUENCY_LABELS[c.frequency]?.[locale === "en" ? "en" : "es"] || c.frequency}
                                </Badge>
                                <Badge className="rounded-full px-2 py-0.5 text-[10px] border-0 bg-[#E2ECE0] text-[#88B078]">
                                  {c.points} pts
                                </Badge>
                              </div>
                              <p className="text-sm text-[#666666] mt-1.5">{c.description}</p>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={busyId === c.id}
                              onClick={() => complete(c.id)}
                              className="shrink-0"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              {busyId === c.id ? "..." : "Completar"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {done.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#88B078]" />
                      Completados
                    </h2>
                    {done.map((c) => (
                      <Card key={c.id} className="p-4 opacity-70">
                        <CardContent className="p-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#E2ECE0] flex items-center justify-center shrink-0">
                              <Check className="w-4 h-4 text-[#88B078]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1A1A1A] truncate">{c.title}</p>
                              {c.completedAt && (
                                <p className="text-[10px] text-[#999999] flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(c.completedAt).toLocaleDateString(
                                    locale === "en" ? "en-US" : "es-ES",
                                    { day: "numeric", month: "short" }
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className="rounded-full px-2 py-0.5 text-[10px] border-0 bg-[#E2ECE0] text-[#88B078] shrink-0">
                            {c.points} pts
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
