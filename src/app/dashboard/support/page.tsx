"use client"

import { useState, useEffect } from "react"
import { redirect, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/ui/skeleton"
import { MessageSquare, Send, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

interface SupportMessage {
  id: string
  subject: string
  message: string
  status: string
  read: boolean
  reply: string | null
  createdAt: string
}

export default function SupportPage() {
  const pathname = usePathname()
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><CardSkeleton /></div>
  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/support/messages")
      const data = await res.json()
      setMessages(Array.isArray(data.data?.messages) ? data.data.messages : [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccess(false)
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Error al enviar mensaje")
      }
      setSuccess(true)
      setSubject("")
      setMessage("")
      toast.success("Mensaje enviado. Te responderemos pronto.")
      fetchMessages()
    } catch (e: any) {
      setError(e.message || "Error al enviar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="text-center mb-4">
        <Badge variant="mint" className="mb-3 rounded-full px-4 py-1.5 border-0">
          <MessageSquare className="w-3.5 h-3.5 mr-2" />
          Soporte
        </Badge>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">{t("support.subtitle", locale)}</h1>
        <p className="text-sm text-[#666666] mt-1">
          {t("support.sendMessage", locale)}.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-[#E2ECE0] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-[#88B078]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">{t("support.sent", locale)}</h2>
              <p className="text-sm text-[#666666] mb-6">Gracias por contactarnos. Te responderemos pronto.</p>
              <Button onClick={() => setSuccess(false)} variant="outline">
                {t("support.sendMessage", locale)}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block text-[#1A1A1A]">{t("support.subject", locale)}</label>
                <input
                  aria-label={t("support.subject", locale)}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("support.subject", locale)}
                  required
                  className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#666666]/50 focus:outline-none focus:ring-2 focus:ring-[#88B078]"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block text-[#1A1A1A]">{t("support.message", locale)}</label>
                <textarea
                  aria-label={t("support.message", locale)}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("support.message", locale)}
                  required
                  rows={5}
                  className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#666666]/50 focus:outline-none focus:ring-2 focus:ring-[#88B078] resize-none"
                />
              </div>

              <Button type="submit" disabled={submitting} className="rounded-full">
                <Send className="w-4 h-4 mr-2" />
                {submitting ? t("common.saving", locale) : t("support.send", locale)}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">{t("support.myMessages", locale)}</h2>
        {loading ? (
          <CardSkeleton />
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-[#666666]">{t("support.noMessages", locale)}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <Card key={m.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#1A1A1A]">{m.subject}</span>
                    <div className="flex items-center gap-2">
                      {m.reply && (
                        <Badge variant="success" className="text-[10px]">{t("support.reply", locale)}</Badge>
                      )}
                      {!m.read && (
                        <span className="w-2 h-2 rounded-full bg-[#88B078]" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[#666666] line-clamp-2 mb-2">{m.message}</p>
                  {m.reply && (
                    <div className="mt-2 p-3 rounded-xl bg-[#F8F9FA] border border-[#E8E8E8]">
                      <p className="text-xs font-medium text-[#88B078] mb-1">{t("support.reply", locale)}:</p>
                      <p className="text-sm text-[#666666]">{m.reply}</p>
                    </div>
                  )}
                  <p className="text-xs text-[#999999] mt-2">
                    {new Date(m.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
                      year: "numeric", month: "long", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
