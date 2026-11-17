"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessagesSquare, Send, Headphones, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/csrf-client"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

interface ChatMessage {
  id: string
  sessionId: string
  message: string
  isAdmin: boolean | null
  read: boolean | null
  createdAt: string
}

const STORAGE_KEY = "tsl_support_chat_session"

export default function SupportChatPage() {
  const { locale } = useLocale()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const ensureSession = useCallback(async (): Promise<string | null> => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    try {
      const res = await apiFetch("/api/chat/session", {
        method: "POST" })
      if (!res.ok) return null
      const d = await res.json()
      const id = d?.data?.sessionId || d?.sessionId
      if (id) localStorage.setItem(STORAGE_KEY, id)
      return id || null
    } catch {
      return null
    }
  }, [])

  const loadMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${encodeURIComponent(id)}`)
      if (res.ok) {
        const d = await res.json()
        setMessages(d?.data?.messages || d.messages || [])
      }
    } catch {
      // silencioso: la UI ya muestra el estado
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const id = await ensureSession()
      if (cancelled) return
      if (!id) {
        setLoading(false)
        return
      }
      setSessionId(id)
      await loadMessages(id)
      setLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [ensureSession, loadMessages])

  // Sondeo para recibir respuestas del equipo
  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(() => loadMessages(sessionId), 6000)
    return () => clearInterval(interval)
  }, [sessionId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    if (!text.trim() || !sessionId) return
    const message = text.trim()
    setSending(true)
    setText("")
    try {
      const res = await apiFetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }) })
      if (!res.ok) throw new Error("No se pudo enviar el mensaje")
      await loadMessages(sessionId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar el mensaje")
      setText(message)
    } finally {
      setSending(false)
    }
  }

  const waitingForTeam = messages.length > 0 && !messages.some((m) => m.isAdmin)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FA" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="text-sm text-[#666666] hover:text-[#1A1A1A] mb-4 inline-block">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          {t("common.back", locale)}
        </Link>

        <div className="text-center mb-8">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Headphones className="w-3.5 h-3.5 mr-2" />
            Soporte
          </Badge>
          <h1 className="font-serif text-3xl font-semibold mb-2 text-[#1A1A1A]">
            Habla con el equipo
          </h1>
          <p className="text-sm text-[#666666] max-w-md mx-auto">
            Escríbenos y te respondemos en este chat. Para problemas con tu plan o pagos
            usa el <Link href="/dashboard/support" className="text-[#88B078] underline">formulario de soporte</Link>.
          </p>
        </div>

        <Card className="p-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[420px] overflow-y-auto p-5 space-y-3 bg-white">
              {loading ? (
                <p className="text-sm text-[#999999] text-center py-16">Cargando conversación...</p>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <MessagesSquare className="w-10 h-10 text-[#E8E8E8] mx-auto mb-3" />
                  <p className="text-sm text-[#666666] font-medium">Escribe tu primera pregunta</p>
                  <p className="text-xs text-[#999999] mt-1">
                    Resolvemos dudas sobre tu análisis, rutina, productos o plan.
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.isAdmin ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        m.isAdmin
                          ? "bg-[#E2ECE0] text-[#1A1A1A] rounded-bl-md"
                          : "bg-[#88B078] text-white rounded-br-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      <p className={`text-[10px] mt-1 ${m.isAdmin ? "text-[#666666]" : "text-white/70"}`}>
                        {m.isAdmin ? "Equipo" : "Tú"} ·{" "}
                        {new Date(m.createdAt).toLocaleString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {waitingForTeam && !loading && (
                <p className="text-[11px] text-[#999999] text-center pt-1">
                  El equipo está revisando tu mensaje. Te respondemos en breve.
                </p>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-[#E8E8E8] p-3 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder="Escribe tu mensaje..."
                  rows={2}
                  className="flex-1 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078] resize-none"
                />
                <Button variant="primary" onClick={send} disabled={sending || !text.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-[#999999] mt-1.5">Enter para enviar · Shift+Enter para salto de línea</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
