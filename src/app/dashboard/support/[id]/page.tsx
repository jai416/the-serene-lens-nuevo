'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

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

const statusMap: Record<string, string> = {
  open: "🟢 Abierto",
  in_progress: "🟡 En Progreso",
  resolved: "✅ Resuelto",
  closed: "⚪ Cerrado",
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
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8D5C4] border-t-transparent" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-gray-500">😅 No se pudo cargar el ticket.</p>
        <button
          onClick={() => router.push("/dashboard/support")}
          className="mt-4 text-[#E8D5C4] hover:underline"
        >
          ← Volver
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <button
        onClick={() => router.push("/dashboard/support")}
        className="text-gray-500 hover:text-gray-700"
      >
        ← Volver
      </button>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        </div>
        <div className="mb-4 flex gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
            {statusMap[ticket.status] || ticket.status}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
            {ticket.priority === "urgent" ? "🔴 Urgente" : "🔵 Normal"}
          </span>
        </div>
        <p className="text-gray-700 dark:text-gray-300">{ticket.message}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Respuestas</h2>
        {ticket.responses.length === 0 ? (
          <p className="text-gray-500">No hay respuestas aún.</p>
        ) : (
          ticket.responses.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl p-4 ${
                r.role === "admin"
                  ? "ml-8 border border-[#E8D5C4] bg-[#FFF8F0] dark:bg-gray-800"
                  : "mr-8 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              {r.role === "admin" && (
                <span className="mb-1 inline-block text-sm font-medium text-[#E8D5C4]">
                  👑 Admin
                </span>
              )}
              <p className="text-gray-700 dark:text-gray-300">{r.content}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
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
          className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={sending || !responseText.trim()}
          className="rounded-lg bg-[#E8D5C4] px-6 py-2 font-medium hover:bg-[#B0CF8D] disabled:opacity-50"
        >
          {sending ? "Enviando..." : "Responder"}
        </button>
      </form>
    </div>
  )
}
