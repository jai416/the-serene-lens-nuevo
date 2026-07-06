'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/ui/skeleton"

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  responseCount: number
}

const statusMap: Record<string, { label: string; variant: "mint" | "secondary" | "success" | "outline" }> = {
  open: { label: "Abierto", variant: "mint" },
  in_progress: { label: "En Progreso", variant: "secondary" },
  resolved: { label: "Resuelto", variant: "success" },
  closed: { label: "Cerrado", variant: "outline" },
}

export default function SupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState("normal")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets")
      const data = await res.json()
      setTickets(data.tickets ?? data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccess(false)
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
      setSubject("")
      setMessage("")
      setPriority("normal")
      fetchTickets()
    } catch {
      setError("Error al crear el ticket. Intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">🎫 Soporte</h1>

      <Card>
        <CardHeader>
          <CardTitle>Crear Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              aria-label="Asunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto"
              required
              className="w-full rounded-lg border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#666666]/50 focus:outline-none focus:ring-1 focus:ring-[#88B078]"
            />
            <textarea
              aria-label="Mensaje"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe tu problema..."
              required
              rows={4}
              className="w-full rounded-lg border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#666666]/50 focus:outline-none focus:ring-1 focus:ring-[#88B078] resize-none"
            />
            <select
              aria-label="Prioridad"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgente</option>
            </select>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">Ticket creado con éxito.</p>
            )}
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Mis Tickets</h2>
        {loading ? (
          <CardSkeleton />
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-[#666666]">No tienes tickets de soporte todavía.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
                className="w-full text-left"
              >
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#1A1A1A]">{ticket.subject}</span>
                      <Badge variant={statusMap[ticket.status]?.variant || "outline"}>
                        {statusMap[ticket.status]?.label || ticket.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#666666]">
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      <span>{ticket.responseCount} respuestas</span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
