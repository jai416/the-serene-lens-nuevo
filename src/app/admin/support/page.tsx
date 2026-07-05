"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ChevronLeft, ChevronRight, Search, RefreshCw, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  createdAt: string
  user: { id: string; name: string; email: string }
  _count: { responses: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  resolved: "bg-green-100 text-green-800 border-green-300",
  closed: "bg-gray-100 text-gray-600 border-gray-300",
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
}

export default function AdminSupportPage() {
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)

  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const fetchTickets = async (p = page, s = statusFilter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" })
      if (s) params.set("status", s)
      const res = await fetch(`/api/admin/support/tickets?${params}`)
      const d = await res.json()
      const data = d?.data || d
      setTickets(data.tickets || [])
      setPagination(data.pagination || null)
    } catch { toast.error("Error al cargar tickets") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets(page, statusFilter) }, [page, statusFilter])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success("Estado actualizado")
      fetchTickets(page, statusFilter)
      if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status })
    } catch { toast.error("Error al actualizar") }
  }

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("Respuesta enviada")
      setReply("")
    } catch { toast.error("Error al enviar respuesta") }
    finally { setSending(false) }
  }

  return (
    <div className="min-h-screen bg-[#1A1F19] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#E8DED5] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#C2E09D]" />
            Tickets de Soporte
          </h1>
          <div className="flex items-center gap-2">
            {["", "open", "in_progress", "resolved", "closed"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-[#C2E09D] text-[#1A1F19]"
                    : "bg-[#222920] text-[#9BAA93] hover:bg-[#2E3829]"
                }`}
              >
                {s ? (s === "in_progress" ? "En curso" : s.charAt(0).toUpperCase() + s.slice(1)) : "Todos"}
              </button>
            ))}
            <button onClick={() => fetchTickets(page, statusFilter)} className="p-2 rounded-lg bg-[#222920] text-[#9BAA93] hover:bg-[#2E3829]">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {loading ? (
              <ListSkeleton />
            ) : tickets.length === 0 ? (
              <p className="text-[#9BAA93] text-sm text-center py-12">No hay tickets</p>
            ) : (
              tickets.map((t) => (
                <Card
                  key={t.id}
                  className={`bg-[#1A1F19] border-[#222920] cursor-pointer transition-all hover:border-[#C2E09D]/50 ${
                    selectedTicket?.id === t.id ? "ring-1 ring-[#C2E09D]" : ""
                  }`}
                  onClick={() => setSelectedTicket(t)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-medium text-[#E8DED5] truncate">{t.subject}</h3>
                      <Badge className={`shrink-0 text-[10px] px-2 py-0.5 ${statusColors[t.status] || ""}`}>
                        {t.status === "in_progress" ? "En curso" : t.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#9BAA93] line-clamp-2 mb-2">{t.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-[#64705E]">
                      <span>{t.user.name || t.user.email}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString("es")}</span>
                      <span>{t._count.responses} respuestas</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${priorityColors[t.priority] || ""}`}>
                        {t.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg bg-[#222920] text-[#9BAA93] hover:bg-[#2E3829] disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#9BAA93]">{page} / {pagination.totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-2 rounded-lg bg-[#222920] text-[#9BAA93] hover:bg-[#2E3829] disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            {selectedTicket ? (
              <Card className="bg-[#1A1F19] border-[#222920]">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-[#E8DED5]">{selectedTicket.subject}</h2>
                      <p className="text-xs text-[#9BAA93] mt-1">
                        {selectedTicket.user.name || selectedTicket.user.email} &middot; {new Date(selectedTicket.createdAt).toLocaleDateString("es")}
                      </p>
                    </div>
                    <Badge className={`text-[10px] px-2 py-0.5 ${priorityColors[selectedTicket.priority] || ""}`}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>

                  <div className="bg-[#222920]/50 rounded-xl p-4">
                    <p className="text-sm text-[#E8DED5] leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>

                  <div>
                    <label className="text-xs text-[#9BAA93] block mb-1">Cambiar estado:</label>
                    <div className="flex gap-2">
                      {["open", "in_progress", "resolved", "closed"].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(selectedTicket.id, s)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            selectedTicket.status === s
                              ? "bg-[#C2E09D] text-[#1A1F19]"
                              : "bg-[#222920] text-[#9BAA93] hover:bg-[#2E3829]"
                          }`}
                        >
                          {s === "in_progress" ? "En curso" : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#9BAA93] block mb-1">Responder:</label>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl bg-[#222920] border border-[#2E3829] text-[#E8DED5] p-3 text-sm resize-none focus:outline-none focus:border-[#C2E09D] placeholder-[#64705E]"
                      placeholder="Escribe tu respuesta..."
                    />
                    <Button
                      onClick={handleReply}
                      disabled={!reply.trim() || sending}
                      className="mt-2 bg-[#C2E09D] text-[#1A1F19] hover:bg-[#D4C4B0]"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Enviar respuesta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64 text-[#9BAA93] text-sm">
                Selecciona un ticket para ver los detalles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
