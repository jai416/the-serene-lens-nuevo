"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Copy, Clock, CheckCircle2, Loader2, Plus, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface ReferralGroup {
  groupId: string
  invitedCount: number
  completedCount: number
  totalRevenue: number
  status: string
  createdAt: string
  completedAt: string | null
  expiresAt: string
  referralCount: number
  isExpired: boolean
  slotsRemaining: number
}

export default function ReferralsPage() {
  const { data: session, status } = useSession()
  const [groups, setGroups] = useState<ReferralGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (session) {
      fetch("/api/referral")
        .then((r) => r.json())
        .then((d) => {
          setGroups(d?.data?.groups || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-pulse text-[#C2E09D]" />
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=/dashboard/referrals")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

  const handleCreateGroup = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/referral", { method: "POST" })
      const data = await res.json()
      const result = data?.data || data

      if (result.groupId) {
        toast.success("Grupo creado. Comparte el enlace con tus amigos.")
        fetch("/api/referral")
          .then((r) => r.json())
          .then((d) => setGroups(d?.data?.groups || []))
      } else {
        toast.error(result.error || "Error al crear grupo")
      }
    } catch {
      toast.error("Error al crear grupo")
    } finally {
      setCreating(false)
    }
  }

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${appUrl}/join/${code}`)
    toast.success("Enlace copiado al portapapeles")
  }

  const activeGroups = groups.filter((g) => g.status === "pending" && !g.isExpired)
  const completedGroups = groups.filter((g) => g.status === "completed")
  const expiredGroups = groups.filter((g) => g.isExpired)

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Users className="w-3.5 h-3.5 mr-2" />
            Referidos
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2F3A2D]">
            Invita a amigos
          </h1>
          <p className="text-[#64705E] mt-2">
            Invita a 3 amigos y gana un análisis de piel gratis.
          </p>
        </div>

        {/* How it works */}
        <Card className="p-6 mb-6">
          <CardContent className="p-0">
            <h3 className="font-medium text-[#2F3A2D] mb-4">Cómo funciona</h3>
            <div className="space-y-3">
              {[
                { step: "1", text: "Crea un grupo de referencia" },
                { step: "2", text: "Comparte el enlace con tus amigos" },
                { step: "3", text: "Cuando 3 amigos se unan, ganas 1 análisis gratis" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#C2E09D] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-[#2F3A2D]">{item.step}</span>
                  </div>
                  <span className="text-sm text-[#2F3A2D]">{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create group */}
        {activeGroups.length === 0 && (
          <Card className="p-6 mb-6">
            <CardContent className="p-0 text-center">
              <Button
                variant="primary"
                onClick={handleCreateGroup}
                disabled={creating}
                className="gap-2"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-pulse" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Crear grupo de referencia
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active groups */}
        {activeGroups.length > 0 && (
          <div className="mb-6">
            <h2 className="font-serif text-xl font-semibold mb-4 text-[#2F3A2D]">Grupos activos</h2>
            <div className="space-y-3">
              {activeGroups.map((group) => (
                <Card key={group.groupId} className="ring-1 ring-[#C2E09D]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-[#2F3A2D]">Grupo {group.groupId}</p>
                        <p className="text-xs text-[#64705E]">
                          Creado {new Date(group.createdAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <Badge className="bg-[#C2E09D] text-[#2F3A2D]">
                        {group.completedCount}/3
                      </Badge>
                    </div>

                    <div className="flex gap-2 mb-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2 rounded-full ${
                            i < group.completedCount ? "bg-[#C2E09D]" : "bg-[#DDE7D3]"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-[#64705E] mb-3">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Expira {new Date(group.expiresAt).toLocaleDateString("es-ES")}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(group.groupId)}
                        className="flex-1 gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar enlace
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`${appUrl}/join/${group.groupId}`, "_blank")}
                        className="gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed groups */}
        {completedGroups.length > 0 && (
          <div className="mb-6">
            <h2 className="font-serif text-xl font-semibold mb-4 text-[#2F3A2D]">Grupos completados</h2>
            <div className="space-y-2">
              {completedGroups.map((group) => (
                <Card key={group.groupId}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#C2E09D]" />
                      <div>
                        <p className="text-sm font-medium text-[#2F3A2D]">
                          Grupo {group.groupId}
                        </p>
                        <p className="text-xs text-[#64705E]">
                          Completado {group.completedAt ? new Date(group.completedAt).toLocaleDateString("es-ES") : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[#C2E09D] text-[#2F3A2D]">+1 gratis</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Expired groups */}
        {expiredGroups.length > 0 && (
          <div>
            <h2 className="font-serif text-xl font-semibold mb-4 text-[#64705E]">Grupos expirados</h2>
            <div className="space-y-2">
              {expiredGroups.map((group) => (
                <Card key={group.groupId} className="opacity-60">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#64705E]">Grupo {group.groupId}</p>
                      <p className="text-xs text-[#9BAA93]">
                        Expirado · {group.completedCount}/3 amigos
                      </p>
                    </div>
                    <Badge variant="outline">Expirado</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {groups.length === 0 && (
          <Card className="p-8">
            <CardContent className="p-0 text-center">
              <Users className="w-12 h-12 text-[#DDE7D3] mx-auto mb-4" />
              <h3 className="font-medium text-[#2F3A2D] mb-2">Sin grupos aún</h3>
              <p className="text-sm text-[#64705E] mb-4">
                Crea tu primer grupo y comparte el enlace con tus amigos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
