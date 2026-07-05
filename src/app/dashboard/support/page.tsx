'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  responseCount: number
}

const statusMap: Record<string, string> = {
  open: "🟢",
  in_progress: "🟡",
  resolved: "✅",
  closed: "⚪",
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
      <h1 className="text-2xl font-bold">🎫 Soporte</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold">Crear Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            aria-label="Asunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto"
            required
            className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
          />
          <textarea
            aria-label="Mensaje"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe tu problema..."
            required
            rows={4}
            className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
          />
          <select
            aria-label="Prioridad"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="normal">Normal</option>
            <option value="urgent">Urgente</option>
          </select>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && (
            <p className="text-sm text-green-600">Ticket creado con éxito.</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#E8D5C4] px-6 py-2 font-medium hover:bg-[#B0CF8D] disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Mis Tickets</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8D5C4] border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No tienes tickets de soporte todavía.
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{ticket.subject}</span>
                  <span className="text-sm">
                    {statusMap[ticket.status] || "⚪"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  <span>{ticket.responseCount} respuestas</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
