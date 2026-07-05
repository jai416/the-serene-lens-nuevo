"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Send, Users, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"

const SEGMENTS = [
  { value: "all", label: "Todos" },
  { value: "free", label: "Usuarios Free" },
  { value: "premium", label: "Premium" },
  { value: "pro", label: "Pro" },
  { value: "proPlus", label: "Pro+" },
  { value: "new", label: "Usuarios Nuevos" },
]

interface NotificationBatch {
  id: string
  title: string
  message: string
  createdAt: string
  segment?: string
}

export default function AdminEmailsPage() {
  const { data: session, status } = useSession()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [link, setLink] = useState("")
  const [segment, setSegment] = useState("all")
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<NotificationBatch[]>([])

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "ADMIN") {
      redirect("/")
    }
  }, [session, status])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/emails/history?limit=50")
      if (res.ok) {
        const d = await res.json()
        const body = d?.data || d
        setHistory(body?.notifications || [])
      }
    } catch {
      toast.error("Error al cargar datos")
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      loadHistory()
    }
  }, [status, loadHistory])

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Título y mensaje son requeridos")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          segment,
          link: link.trim() || undefined,
        }),
      })

      const d = await res.json()
      const body = d?.data || d

      if (res.ok) {
        toast.success(`Notificaciones enviadas: ${body?.sent ?? 0}, fallidas: ${body?.failed ?? 0}`)
        setTitle("")
        setMessage("")
        setLink("")
        loadHistory()
      } else {
        toast.error(body?.error?.message || body?.error || "Error al enviar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSending(false)
    }
  }

  if (status === "loading") return <div className="min-h-screen bg-[#F8FAF5] dark:bg-[#1A1F19] flex items-center justify-center"><ListSkeleton rows={4} /></div>

  return (
    <div className="min-h-screen bg-[#F8FAF5] dark:bg-[#1A1F19]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2F3A2D] dark:text-[#E8EDE6] flex items-center gap-3">
              <Bell className="w-8 h-8 text-[#C2E09D]" />
              Notificaciones
            </h1>
            <p className="text-[#64705E] dark:text-[#9BAA93] mt-1">
              Envía notificaciones a tus usuarios por segmento
            </p>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-4">
              Nueva notificación
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6] mb-1">
                  Segmento destino
                </label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-4 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2E09D] bg-background text-[#2F3A2D] dark:text-[#E8EDE6]"
                >
                  {SEGMENTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6] mb-1">
                  Título (máx. 100 caracteres)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                  className="w-full px-4 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2E09D] bg-background text-[#2F3A2D] dark:text-[#E8EDE6]"
                  placeholder="Título de la notificación"
                  maxLength={100}
                />
                <p className="text-xs text-[#64705E] dark:text-[#9BAA93] mt-1">{title.length}/100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6] mb-1">
                  Mensaje
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2E09D] bg-background text-[#2F3A2D] dark:text-[#E8EDE6] resize-y"
                  placeholder="Escribe el mensaje de la notificación..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6] mb-1">
                  Link (opcional)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-4 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2E09D] bg-background text-[#2F3A2D] dark:text-[#E8EDE6]"
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F0F5EC] dark:bg-[#2A3228] rounded-lg">
                <div className="flex items-center gap-2 text-[#2F3A2D] dark:text-[#E8EDE6]">
                  <Users className="w-5 h-5 text-[#C2E09D]" />
                  <span className="font-medium">
                    Los usuarios del segmento seleccionado recibirán esta notificación
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={sending || !title.trim() || !message.trim()}
                className="bg-[#C2E09D] text-[#2F3A2D] hover:bg-[#B0D48E]"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-4">
              Historial de notificaciones
            </h2>

            {history.length === 0 ? (
              <p className="text-[#64705E] dark:text-[#9BAA93] text-center py-8">
                No hay notificaciones enviadas aún
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#DDE7D3] dark:border-[#3A4536]">
                      <th className="text-left py-3 px-2 text-[#2F3A2D] dark:text-[#E8EDE6] font-semibold">Título</th>
                      <th className="text-left py-3 px-2 text-[#2F3A2D] dark:text-[#E8EDE6] font-semibold">Mensaje</th>
                      <th className="text-left py-3 px-2 text-[#2F3A2D] dark:text-[#E8EDE6] font-semibold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((n) => (
                      <tr key={n.id} className="border-b border-[#DDE7D3] dark:border-[#3A4536] last:border-0">
                        <td className="py-3 px-2 text-[#2F3A2D] dark:text-[#E8EDE6] font-medium max-w-[200px] truncate">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#C2E09D] shrink-0" />
                            {n.title}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-[#64705E] dark:text-[#9BAA93] max-w-[250px] truncate">
                          {n.message}
                        </td>
                        <td className="py-3 px-2 text-[#64705E] dark:text-[#9BAA93] text-xs whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
