"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, CheckCircle2, Flame, Target, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface Challenge {
  id: string
  title: string
  description: string
  points: number
  frequency: string
  completed: boolean
  completedAt: string | null
}

export default function ChallengesPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/challenges")
      .then((res) => (res.ok ? res.json() : { data: { challenges: [], totalPoints: 0 } }))
      .then((data) => {
        setChallenges(data.data?.challenges || [])
        setTotalPoints(data.data?.totalPoints || 0)
      })
      .catch(() => toast.error("Error al cargar desafíos"))
      .finally(() => setLoading(false))
  }, [])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#F0F5EC] animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const completeChallenge = async (challengeId: string) => {
    setCompleting(challengeId)
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`+${data.data.pointsEarned} puntos ganados`)
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === challengeId
              ? { ...c, completed: true, completedAt: new Date().toISOString() }
              : c
          )
        )
        setTotalPoints((prev) => prev + data.data.pointsEarned)
      } else {
        toast.error(data.error?.message || "Error al completar desafío")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCompleting(null)
    }
  }

  const completedCount = challenges.filter((c) => c.completed).length

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Trophy className="w-3.5 h-3.5 mr-2" />
            Desafíos
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2F3A2D]">
            Desafíos de Skincare
          </h1>
          <p className="text-[#64705E] mt-1 text-sm">
            Completa retos semanales y gana puntos por tus hábitos de cuidado facial.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 border-t-4 border-t-[#C2E09D]">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ECFFD3] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-[#2F3A2D]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2F3A2D]">{totalPoints}</p>
                  <p className="text-xs text-[#64705E]">Puntos totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-5 border-t-4 border-t-[#FFF6AD]">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF6AD] flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#2F3A2D]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2F3A2D]">{completedCount}/{challenges.length}</p>
                  <p className="text-xs text-[#64705E]">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-5 border-t-4 border-t-[#ECFFD3]">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C2E09D] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#2F3A2D]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2F3A2D]">
                    {challenges.filter((c) => !c.completed).length}
                  </p>
                  <p className="text-xs text-[#64705E]">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {challenges.map((challenge) => (
            <Card
              key={challenge.id}
              className={`p-5 transition-all duration-300 ${
                challenge.completed ? "opacity-75" : "hover:shadow-[0_8px_24px_rgba(47,58,45,0.1)]"
              }`}
            >
              <CardContent className="p-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    challenge.completed ? "bg-[#C2E09D]" : "bg-[#F0F5EC]"
                  }`}>
                    {challenge.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2F3A2D]" />
                    ) : (
                      <Target className="w-5 h-5 text-[#64705E]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#2F3A2D] truncate">{challenge.title}</h3>
                    <p className="text-xs text-[#64705E] truncate">{challenge.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="tertiary" className="rounded-full text-[10px]">
                    +{challenge.points} pts
                  </Badge>
                  {challenge.completed ? (
                    <Badge variant="success" className="rounded-full text-[10px]">
                      Completado
                    </Badge>
                  ) : (
                    <button
                      onClick={() => completeChallenge(challenge.id)}
                      disabled={completing === challenge.id}
                      className="px-4 py-2 bg-[#C2E09D] text-[#2F3A2D] rounded-full text-xs font-semibold hover:bg-[#B0D48E] transition-all disabled:opacity-50"
                    >
                      {completing === challenge.id ? "..." : "Completar"}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {challenges.length === 0 && (
            <Card className="p-8 text-center">
              <CardContent className="p-0">
                <Trophy className="w-10 h-10 text-[#8A9A82] mx-auto mb-3" />
                <p className="text-[#64705E] text-sm">No hay desafíos disponibles aún.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
