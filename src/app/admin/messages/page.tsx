"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowLeft, Eye, EyeOff, Star, Crown } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

interface ContactMessage {
  id: string
  userId: string
  name: string
  email: string
  plan: string
  role: string
  subject: string
  message: string
  read: boolean
  reply: string | null
  createdAt: string
}

export default function AdminMessagesPage() {
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/admin/messages")
        .then((r) => r.ok ? r.json() : { data: { messages: [] } })
        .then((d) => setMessages(d?.data?.messages || d.messages || []))
        .catch(() => toast.error("Error al cargar mensajes"))
    }
  }, [session])

  if (status === "loading") return <div className="flex items-center justify-center py-20"><ListSkeleton rows={5} /></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const markRead = async (id: string, read: boolean) => {
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read }),
      })
      if (res.ok) {
        setMessages(messages.map((m) => (m.id === id ? { ...m, read } : m)))
      }
    } catch {
      toast.error("Error al actualizar mensaje")
    }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selected || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, reply: replyText.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("Respuesta enviada")
      setMessages(messages.map((m) => m.id === selected.id ? { ...m, reply: replyText.trim() } : m))
      setSelected({ ...selected, reply: replyText.trim() })
      setReplyText("")
    } catch {
      toast.error("Error al enviar respuesta")
    } finally {
      setSending(false)
    }
  }

  const unread = messages.filter((m) => !m.read).length

  // Sort: Pro+/Pro first, then Esthetician, then rest
  const sortedMessages = [...messages].sort((a, b) => {
    const planOrder: Record<string, number> = { "PRO_PLUS": 0, "PRO": 1, "ESTHETICIAN": 2, "PREMIUM": 3, "FREE": 4 }
    return (planOrder[a.plan] ?? 5) - (planOrder[b.plan] ?? 5)
  })

  const proMessages = sortedMessages.filter((m) => m.plan === "PRO_PLUS" || m.plan === "PRO")
  const estheticianMessages = sortedMessages.filter((m) => m.plan === "ESTHETICIAN")
  const otherMessages = sortedMessages.filter((m) => m.plan !== "PRO_PLUS" && m.plan !== "PRO" && m.plan !== "ESTHETICIAN")

  return (
    <div className="overflow-x-hidden">
      <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#666666] hover:text-[#1A1A1A]">{t("common.back", locale)}</Link>
        <Badge className="bg-[#88B078]/20 text-[#88B078] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
          <MessageSquare className="w-3 h-3 mr-1.5" />
          Mensajes
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-3">
          Buzón de <span style={{ color: "#88B078" }}>Mensajes</span>
        </h1>
        <p className="text-sm text-[#666666] mt-1">
          {unread > 0 ? `${unread} mensajes sin leer` : "Todos los mensajes leídos"}
        </p>
      </div>

      {proMessages.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-[#FBBF24]" />
            <span className="text-sm font-semibold text-[#1A1A1A]">PRO / PRO+</span>
            <span className="text-[10px] text-[#666666]">({proMessages.length})</span>
          </div>
          <MessageList messages={proMessages} selected={selected} onSelect={setSelected} onMarkRead={markRead} />
        </div>
      )}

      {estheticianMessages.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-[#88B078]" />
            <span className="text-sm font-semibold text-[#1A1A1A]">Esteticistas</span>
            <span className="text-[10px] text-[#666666]">({estheticianMessages.length})</span>
          </div>
          <MessageList messages={estheticianMessages} selected={selected} onSelect={setSelected} onMarkRead={markRead} />
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-[#666666]" />
          <span className="text-sm font-semibold text-[#1A1A1A]">Otros</span>
          <span className="text-[10px] text-[#666666]">({otherMessages.length})</span>
        </div>
        <MessageList messages={otherMessages} selected={selected} onSelect={setSelected} onMarkRead={markRead} />
      </div>

      {/* Selected message detail */}
      {selected && (
        <Card className="mt-4" style={{ backgroundColor: "white", borderColor: "#E8E8E8" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A1A]">{selected.name}</h2>
                <p className="text-sm text-[#666666]">{selected.email}</p>
                <Badge className="mt-1 text-[10px]" style={{ backgroundColor: "#E8E8E8", color: selected.plan === "PRO_PLUS" || selected.plan === "PRO" ? "#FBBF24" : "#666666" }}>
                  {selected.plan}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markRead(selected.id, !selected.read)}
                  style={{ color: "#666666" }}
                >
                  {selected.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Badge className="mb-4" style={{ backgroundColor: "#E8E8E8", color: "#666666" }}>{selected.subject}</Badge>
            <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
              {selected.message}
            </p>

            {selected.reply && (
              <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "white", border: "1px solid #E8E8E8" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#88B078" }}>Tu respuesta:</p>
                <p className="text-sm" style={{ color: "#1A1A1A" }}>{selected.reply}</p>
              </div>
            )}

            <div className="mt-4">
              <label className="text-xs block mb-1" style={{ color: "#666666" }}>Responder:</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
                style={{ backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8", color: "#1A1A1A" }}
                placeholder="Escribe tu respuesta..."
              />
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                size="sm"
                className="mt-2"
                style={{ backgroundColor: "#88B078", color: "#fff" }}
              >
                {sending ? "Enviando..." : "Enviar respuesta"}
              </Button>
            </div>

            <p className="text-xs mt-4" style={{ color: "#666666" }}>
              Recibido: {formatDate(selected.createdAt)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MessageList({
  messages,
  selected,
  onSelect,
  onMarkRead,
}: {
  messages: ContactMessage[]
  selected: ContactMessage | null
  onSelect: (m: ContactMessage) => void
  onMarkRead: (id: string, read: boolean) => void
}) {
  if (messages.length === 0) return null
  return (
    <div className="space-y-2">
      {messages.map((m) => (
        <div
          key={m.id}
          onClick={() => {
            onSelect(m)
            if (!m.read) onMarkRead(m.id, true)
          }}
          className="p-4 rounded-xl cursor-pointer transition-all"
          style={{
            backgroundColor: selected?.id === m.id ? "white" : "#F8F9FA",
            border: `1px solid ${!m.read ? "#88B078" : "#E8E8E8"}`,
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {!m.read && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#88B078" }} />}
              <p className="font-medium text-sm text-[#1A1A1A]">{m.name}</p>
              <Badge className="text-[10px]" style={{ backgroundColor: "#E8E8E8", color: "#666666" }}>
                {m.plan}
              </Badge>
            </div>
            <span className="text-xs text-[#666666]">{formatDate(m.createdAt)}</span>
          </div>
          <p className="text-xs text-[#666666]">{m.email}</p>
          <p className="text-xs text-[#666666] mt-1">{m.subject}</p>
          <p className="text-sm text-[#666666] mt-1 line-clamp-2">{m.message}</p>
        </div>
      ))}
    </div>
  )
}
