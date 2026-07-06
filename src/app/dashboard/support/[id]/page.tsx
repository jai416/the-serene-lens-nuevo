'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/ui/skeleton"

interface Response {
  id: string
  content: string
  role: "user" | "admin"
  createdAt: string
}

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  message: string
  responses: Response[]
}

const statusMap: Record<string, { label: string; variant: "mint" | "secondary" | "success" | "outline" }> = {
  open: { label: "Abierto", variant: "mint" },
  in_progress: { label: "En Progreso", variant: "secondary" },
  resolved: { label: "Resuelto", variant: "success" },
  closed: { label: "Cerrado", variant: "outline" },
}

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [responseText, setResponseText] = useState("")
  const [sending, setSending] = useState(false)

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTicket(data.ticket ?? data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [id])

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseText.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/tickets/${id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: responseText.trim() }),
      })
      if (!res.ok) throw new Error()
      setResponseText("")
      fetchTicket()
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <CardSkeleton />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-[#666666]">😅 No se pudo cargar el ticket.</p>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/support")}
          className="mt-4"
        >
          ← Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/support")}
      >
        ← Volver
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-[#1A1A1A]">{ticket.subject}</CardTitle>
            <Badge variant={statusMap[ticket.status]?.variant || "outline"}>
              {statusMap[ticket.status]?.label || ticket.status}
            </Badge>
            <Badge variant={ticket.priority === "urgent" ? "tertiary" : "mint"}>
              {ticket.priority === "urgent" ? "🔴 Urgente" : "🔵 Normal"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[#666666]">{ticket.message}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Respuestas</h2>
        {ticket.responses.length === 0 ? (
          <p className="text-[#666666]">No hay respuestas aún.</p>
        ) : (
          ticket.responses.map((r) => (
            <Card
              key={r.id}
              className={
                r.role === "admin"
                  ? "ml-8 border-[#88B078] bg-[#F8F9FA]"
                  : "mr-8"
              }
            >
              <CardContent className="p-4">
                {r.role === "admin" && (
                  <span className="mb-1 inline-block text-sm font-medium text-[#88B078]">
                    👑 Admin
                  </span>
                )}
                <p className="text-[#666666]">{r.content}</p>
                <p className="mt-1 text-xs text-[#666666]/60">
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <form onSubmit={handleSubmitResponse} className="space-y-3">
        <textarea
          aria-label="Escribe una respuesta"
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder="Escribe una respuesta..."
          rows={3}
          required
          className="w-full rounded-lg border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#666666]/50 focus:outline-none focus:ring-1 focus:ring-[#88B078] resize-none"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={sending || !responseText.trim()}
        >
          {sending ? "Enviando..." : "Responder"}
        </Button>
      </form>
    </div>
  )
}
