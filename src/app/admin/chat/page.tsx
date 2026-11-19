"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessagesSquare, ArrowLeft, Send, RefreshCw, User } from "lucide-react"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"
import { apiFetch } from "@/lib/csrf-client"

interface ChatSession {
  sessionId: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

interface ChatMessage {
  id: string
  sessionId: string
  message: string
  isAdmin: boolean
  read: boolean
  createdAt: string
}

export default function AdminChatPage() {
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat/sessions")
      if (res.ok) {
        const d = await res.json()
        const list = d?.data?.sessions || d.sessions || []
        setSessions(list)
        setActiveId((prev) => prev || list[0]?.sessionId || null)
      }
    } catch {
      toast.error("Error al cargar las conversaciones")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/chat/${sessionId}/messages`)
      if (res.ok) {
        const d = await res.json()
        setMessages(d?.data?.messages || d.messages || [])
      }
    } catch {
      toast.error("Error al cargar los mensajes")
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") loadSessions()
  }, [session, loadSessions])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><ListSkeleton rows={4} /></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const sendReply = async () => {
    if (!reply.trim() || !activeId) return
    setSending(true)
    try {
      const res = await apiFetch(`/api/admin/chat/${activeId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }) })
      if (!res.ok) throw new Error("No se pudo enviar el mensaje")
      setReply("")
      await loadMessages(activeId)
      await loadSessions()
      toast.success("Respuesta enviada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar el mensaje")
    } finally {
      setSending(false)
    }
  }

  const active = sessions.find((s) => s.sessionId === activeId)

  return (
    <div className="overflow-x-hidden">
      <div className="mb-8">
        <Link href="/admin" className="text-sm text-[#666666] hover:text-[#1A1A1A] mb-4 inline-block">
          {t("common.back", locale)}
        </Link>
        <Badge className="bg-[#88B078]/20 text-[#88B078] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
          <MessagesSquare className="w-3 h-3 mr-1.5" />
          Soporte
        </Badge>
        <div className="flex items-center justify-between mt-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">Bandeja de soporte</h1>
          <Button variant="secondary" size="sm" onClick={loadSessions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
        <p className="text-sm text-[#666666] mt-1">
          Conversaciones de los usuarios. Tus respuestas aparecen en su chat.
        </p>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : sessions.length === 0 ? (
        <Card className="p-10 text-center">
          <CardContent className="p-0">
            <MessagesSquare className="w-10 h-10 text-[#E8E8E8] mx-auto mb-3" />
            <p className="text-sm text-[#666666]">No hay conversaciones todavía.</p>
            <p className="text-xs text-[#999999] mt-1">
              Cuando un usuario escriba en el chat de la app, aparecerá aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4 items-start">
          {/* Lista de conversaciones */}
          <div className="space-y-2">
            {sessions.map((s) => (
              <button
                key={s.sessionId}
                onClick={() => setActiveId(s.sessionId)}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                  activeId === s.sessionId
                    ? "border-[#88B078] bg-[#F0F5EE]"
                    : "border-[#E8E8E8] bg-white hover:border-[#88B078]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#1A1A1A] flex items-center gap-1.5">
                    <User className="w-3 h-3 text-[#88B078]" />
                    {s.sessionId.slice(0, 8)}
                  </span>
                  {s.unreadCount > 0 && (
                    <Badge className="rounded-full px-2 py-0 text-[10px] border-0 bg-[#88B078] text-[#1A1A1A]">
                      {s.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#666666] mt-1.5 line-clamp-2">{s.lastMessage}</p>
                <p className="text-[10px] text-[#999999] mt-1">
                  {new Date(s.lastMessageAt).toLocaleString("es-ES", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit" })}
                </p>
              </button>
            ))}
          </div>

          {/* Hilo de mensajes */}
          <Card className="p-5 min-h-[420px] flex flex-col">
            <CardContent className="p-0 flex flex-col flex-1">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E8]">
                <h2 className="text-sm font-semibold text-[#1A1A1A]">
                  Conversación {activeId?.slice(0, 8)}
                </h2>
                {active?.lastMessageAt && (
                  <span className="text-[10px] text-[#999999]">
                    Última actividad {new Date(active.lastMessageAt).toLocaleString("es-ES")}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3 py-4 max-h-[420px] overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-sm text-[#999999] text-center py-8">Sin mensajes.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          m.isAdmin
                            ? "bg-[#88B078] text-[#1A1A1A] rounded-br-md"
                            : "bg-[#F8F9FA] text-[#1A1A1A] rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                        <p className={`text-[10px] mt-1 ${m.isAdmin ? "text-white/70" : "text-[#999999]"}`}>
                          {m.isAdmin ? "Tú" : "Usuario"} ·{" "}
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
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#E8E8E8]">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply()
                  }}
                  placeholder="Escribe tu respuesta al usuario..."
                  rows={2}
                  className="flex-1 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078] resize-none"
                />
                <Button variant="primary" onClick={sendReply} disabled={sending || !reply.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-[#999999] mt-2">Ctrl+Enter para enviar</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
