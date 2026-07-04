"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, ArrowLeft, Send, Users } from "lucide-react"
import { toast } from "sonner"

interface LinkedUser {
  id: string
  name: string | null
  email: string
  role: string
  plan: string
  telegramId: string
  createdAt: string
}

export default function AdminTelegramPage() {
  const { data: session, status } = useSession()
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [broadcastText, setBroadcastText] = useState("")
  const [sending, setSending] = useState(false)

  const loadLinkedUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?telegramLinked=true")
      if (res.ok) {
        const d = await res.json()
        setLinkedUsers(d?.data?.users || d.users || [])
      }
    } catch {
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") loadLinkedUsers()
  }, [session, loadLinkedUsers])

  if (status === "loading") return <div className="flex items-center justify-center py-20"><p className="text-[#8892B0]">Cargando...</p></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const handleUnlink = async (userId: string) => {
    if (!confirm("¿Desvincular este usuario de Telegram?")) return
    try {
      const res = await fetch(`/api/admin/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, telegramId: null }),
      })
      if (res.ok) {
        setLinkedUsers(linkedUsers.filter((u) => u.id !== userId))
        toast.success("Usuario desvinculado")
      }
    } catch {
      toast.error("Error al desvincular")
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/admin/telegram/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastText }),
      })
      if (res.ok) {
        const d = await res.json()
        const data = d?.data || d
        toast.success(`Enviado a ${data.sent || 0} usuarios (${data.failed || 0} fallos)`)
        setBroadcastText("")
      } else {
        toast.error("Error al enviar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="overflow-x-hidden">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-[#8892B0] hover:text-[#E2E8F0] inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Volver al panel
        </Link>
        <Badge className="bg-[#7C8CFF]/20 text-[#7C8CFF] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
          <MessageCircle className="w-3 h-3 mr-1.5" />
          Telegram
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#E2E8F0] mt-3">
          Gestión de <span style={{ color: "#7C8CFF" }}>Telegram</span>
        </h1>
        <p className="text-sm text-[#8892B0] mt-1">Usuarios vinculados, notificaciones masivas y logs del bot</p>
      </div>

      {/* Broadcast */}
      <Card className="mb-6" style={{ backgroundColor: "#22263A", borderColor: "#2D3350" }}>
        <CardContent className="p-5">
          <h2 className="text-base font-semibold mb-3 text-[#E2E8F0] flex items-center gap-2">
            <Send className="w-4 h-4 text-[#7C8CFF]" />
            Notificaciones Masivas
          </h2>
          <div className="flex gap-2">
            <input
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="Escribe el mensaje para enviar a todos los usuarios vinculados..."
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "#2D3350", border: "1px solid #3D4270", color: "#E2E8F0" }}
              onKeyDown={(e) => e.key === "Enter" && handleBroadcast()}
            />
            <Button onClick={handleBroadcast} disabled={sending || !broadcastText.trim()} style={{ backgroundColor: "#7C8CFF", color: "#fff" }}>
              {sending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
          <p className="text-xs text-[#5A6485] mt-2">{linkedUsers.length} usuarios recibirán el mensaje</p>
        </CardContent>
      </Card>

      {/* Broadcast API */}
      <Card className="mb-6" style={{ backgroundColor: "#22263A", borderColor: "#2D3350" }}>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3 text-[#E2E8F0]">API de Transmisión</h2>
          <p className="text-xs text-[#8892B0] mb-2">
            Usa este endpoint para enviar mensajes desde scripts externos:
          </p>
          <pre className="text-[10px] p-2 rounded" style={{ backgroundColor: "#1A1D27", color: "#7C8CFF" }}>
POST /api/admin/telegram/broadcast {'{"message":"tu mensaje"}'}
          </pre>
        </CardContent>
      </Card>

      {/* Linked Users */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card style={{ backgroundColor: "#22263A", borderColor: "#2D3350" }}>
          <CardContent className="p-5">
            <h2 className="text-base font-semibold mb-4 text-[#E2E8F0] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7C8CFF]" />
              Usuarios Vinculados ({linkedUsers.length})
            </h2>
            {loading ? (
              <p className="text-[#8892B0] text-center py-4">Cargando...</p>
            ) : linkedUsers.length === 0 ? (
              <p className="text-[#8892B0] text-center py-4">Ningún usuario vinculado a Telegram</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {linkedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "#1A1D27" }}>
                    <div>
                      <p className="text-sm font-medium text-[#E2E8F0]">{user.name || user.email}</p>
                      <p className="text-xs text-[#8892B0]">{user.email} · {user.plan} · @{user.telegramId}</p>
                    </div>
                    <button
                      onClick={() => handleUnlink(user.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: "#FB7185" }}
                    >
                      Desvincular
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send API */}
        <Card style={{ backgroundColor: "#22263A", borderColor: "#2D3350" }}>
          <CardContent className="p-5">
            <h2 className="text-base font-semibold mb-4 text-[#E2E8F0] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#7C8CFF]" />
              Envío Programado
            </h2>
            <p className="text-xs text-[#8892B0] mb-3">
              Programa mensajes para enviar más tarde usando el endpoint:
            </p>
            <pre className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: "#1A1D27", color: "#7C8CFF" }}>
{`curl -X POST /api/admin/telegram/broadcast \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Novedades en The Serene Lens!"}'`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
