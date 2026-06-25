"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Loader2, CheckCircle2, Clock, Gift } from "lucide-react"
import { toast } from "sonner"

interface GroupInfo {
  groupId: string
  referrerName: string
  invitedCount: number
  completedCount: number
  status: string
  isExpired: boolean
  slotsRemaining: number
  referrals: number
}

export default function JoinPage() {
  const params = useParams()
  const code = params.code as string
  const { data: session, status } = useSession()
  const router = useRouter()
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (code) {
      fetch(`/api/referral/${code}`)
        .then((r) => r.json())
        .then((d) => {
          const data = d?.data || d
          setGroup(data)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [code])

  const handleJoin = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/join/${code}`)}`)
      return
    }

    setJoining(true)
    try {
      const res = await fetch(`/api/referral/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      const result = data?.data || data

      if (result.success) {
        toast.success(result.completed
          ? "🎉 ¡Grupo completado! Has ganado un análisis gratis para tu amigo."
          : "Te has unido al grupo correctamente."
        )
        setGroup((prev) => prev ? {
          ...prev,
          completedCount: result.count,
          slotsRemaining: Math.max(0, 3 - result.count),
        } : prev)
      } else {
        toast.error(result.error || "Error al unirse al grupo")
      }
    } catch {
      toast.error("Error al procesar")
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-pulse text-[#C2E09D]" />
      </div>
    )
  }

  if (!group || group.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-[#E07070] mx-auto mb-4" />
            <h1 className="font-serif text-2xl font-semibold text-[#2F3A2D] mb-2">
              Grupo no disponible
            </h1>
            <p className="text-[#64705E] mb-4">
              Este grupo ha expirado o no existe.
            </p>
            <Link href="/">
              <Button variant="primary">Ir al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = group.status === "completed"
  const isFull = group.slotsRemaining === 0

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#C2E09D]/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#2F3A2D]" />
            </div>
            <Badge variant="primary" className="mb-3 rounded-full px-4 py-1.5 border-0">
              Invitación de grupo
            </Badge>
            <h1 className="font-serif text-2xl font-semibold text-[#2F3A2D]">
              {group.referrerName} te ha invitado
            </h1>
            <p className="text-[#64705E] mt-2">
              Descubre cómo está tu piel y ayuda a completar el grupo.
            </p>
          </div>

          <div className="bg-[#F8FAF5] rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[#64705E]">Progreso del grupo</span>
              <span className="text-sm font-medium text-[#2F3A2D]">
                {group.completedCount}/3 amigos
              </span>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full ${
                    i < group.completedCount
                      ? "bg-[#C2E09D]"
                      : "bg-[#DDE7D3]"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#64705E]">
              <span>{group.completedCount} completados</span>
              <span>{group.slotsRemaining} plazas restantes</span>
            </div>
          </div>

          <div className="bg-[#FFF6AD]/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-[#2F3A2D]" />
              <span className="text-sm font-medium text-[#2F3A2D]">Beneficio</span>
            </div>
            <p className="text-sm text-[#64705E]">
              Cuando el grupo se complete (3 amigos), <strong>{group.referrerName} ganará un análisis GRATIS</strong>.
              ¡Tu también puedes crear tu propio grupo y ganar!
            </p>
          </div>

          {isCompleted ? (
            <div className="text-center">
              <CheckCircle2 className="w-10 h-10 text-[#C2E09D] mx-auto mb-2" />
              <p className="text-[#2F3A2D] font-medium">¡Grupo completo!</p>
              <p className="text-sm text-[#64705E]">Ya se han unido 3 amigos.</p>
            </div>
          ) : (
            <Button
              variant="primary"
              className="w-full"
              onClick={handleJoin}
              disabled={joining || isFull}
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-pulse" />
                  Procesando...
                </>
              ) : !session ? (
                "Iniciar sesión para unirme"
              ) : (
                "Unirme al grupo"
              )}
            </Button>
          )}

          <p className="text-xs text-center text-[#9BAA93] mt-4">
            Código: {code}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
