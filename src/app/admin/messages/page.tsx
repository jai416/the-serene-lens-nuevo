"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface Message {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: string
}

export default function AdminMessagesPage() {
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/admin/messages")
        .then((r) => r.ok ? r.json() : { data: { messages: [] } })
        .then((d) => setMessages(d?.data?.messages || d.messages || []))
        .catch(() => toast.error("Error al cargar mensajes"))
    }
  }, [session])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-[#64705E] dark:text-[#9BAA93]">Cargando...</p></div>
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

  const unread = messages.filter((m) => !m.read).length

  return (
    <div className="min-h-screen bg-[#F8FAF5] dark:bg-[#1A1F19] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#64705E] dark:text-[#9BAA93] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6] inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="w-3 h-3" /> Volver al panel
          </Link>
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <MessageSquare className="w-3.5 h-3.5 mr-2" />
            Mensajes
          </Badge>
          <h1 className="font-serif text-3xl font-semibold mb-2 text-[#2F3A2D] dark:text-[#E8EDE6]">
            Buzón de <span className="text-[#C2E09D]">Mensajes</span>
          </h1>
          <p className="text-sm text-[#64705E] dark:text-[#9BAA93]">
            {unread > 0 ? `${unread} mensajes sin leer` : "Todos los mensajes leídos"}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="text-center text-[#64705E] dark:text-[#9BAA93] py-10">No hay mensajes</p>
            ) : (
              messages.map((m) => (
                <Card
                  key={m.id}
                  className={`cursor-pointer transition-all ${
                    !m.read ? "ring-1 ring-[#C2E09D]/30" : ""
                  }`}
                  onClick={() => {
                    setSelected(m)
                    if (!m.read) markRead(m.id, true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {!m.read && <span className="w-2 h-2 rounded-full bg-[#C2E09D]" />}
                        <p className="font-medium text-sm text-[#2F3A2D] dark:text-[#E8EDE6]">{m.name}</p>
                      </div>
                      <span className="text-xs text-[#64705E] dark:text-[#9BAA93]">{formatDate(m.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">{m.subject}</p>
                    <p className="text-sm text-[#64705E] dark:text-[#9BAA93] mt-1 line-clamp-2">{m.message}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div>
            {selected ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-serif text-lg font-semibold text-[#2F3A2D] dark:text-[#E8EDE6]">{selected.name}</h2>
                      <p className="text-sm text-[#64705E] dark:text-[#9BAA93]">{selected.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead(selected.id, !selected.read)}
                      >
                        {selected.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Badge variant="secondary" className="mb-4">{selected.subject}</Badge>
                  <p className="text-sm text-[#2F3A2D] dark:text-[#E8EDE6] leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </p>
                  <p className="text-xs text-[#64705E] dark:text-[#9BAA93] mt-6">
                    Recibido: {formatDate(selected.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-[#64705E] dark:text-[#9BAA93] text-sm">Selecciona un mensaje para verlo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
