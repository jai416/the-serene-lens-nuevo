"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Mail, Send, Users, Eye, ArrowLeft, CheckCircle, XCircle, Clock
} from "lucide-react"
import { toast } from "sonner"

interface RecipientCounts {
  all: number
  free: number
  premium: number
  pro: number
  active: number
  inactive: number
  new: number
}

interface EmailLog {
  id: string
  subject: string
  recipient: string
  segment: string
  status: string
  sentAt: string
}

interface EmailHistory {
  logs: EmailLog[]
  pagination: { page: number; limit: number; total: number; pages: number }
  recipientCounts: RecipientCounts
}

const SEGMENT_LABELS: Record<string, string> = {
  all: "Todos",
  free: "Free",
  premium: "Premium",
  pro: "Pro",
  pro_plus: "Pro+",
  active: "Activos",
  inactive: "Inactivos",
  new: "Nuevos (30 días)",
}

const TEMPLATES = [
  {
    name: "Anuncio general",
    subject: "Novedades de The Serene Lens",
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h1 style="color: #2F3A2D; font-size: 24px;">Hola {name},</h1>
<p style="color: #64705E; font-size: 16px; line-height: 1.6;">Tenemos novedades emocionantes para compartir contigo.</p>
<div style="background: #F8FAF5; border-radius: 12px; padding: 20px; margin: 20px 0;">
<p style="color: #2F3A2D; font-size: 16px; line-height: 1.6;">[Escribe tu mensaje aquí]</p>
</div>
<a href="https://the-serene-lens-nuevo.onrender.com" style="display: inline-block; background: #C2E09D; color: #2F3A2D; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Descubrir más</a>
<p style="color: #64705E; font-size: 14px; margin-top: 24px;">The Serene Lens — Observación cosmética, no diagnóstico médico.</p>
</div>`,
  },
  {
    name: "Promoción",
    subject: "Oferta especial para ti",
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #C2E09D, #DAF0B8); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
<h1 style="color: #2F3A2D; font-size: 24px; margin: 0;">Oferta especial</h1>
<p style="color: #2F3A2D; font-size: 18px; margin: 8px 0 0;">[Descuento o beneficio]</p>
</div>
<p style="color: #64705E; font-size: 16px; line-height: 1.6;">Hola {name},</p>
<p style="color: #64705E; font-size: 16px; line-height: 1.6;">[Describe la oferta aquí]</p>
<a href="https://the-serene-lens-nuevo.onrender.com/pricing" style="display: inline-block; background: #C2E09D; color: #2F3A2D; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Aprovechar oferta</a>
<p style="color: #64705E; font-size: 14px; margin-top: 24px;">The Serene Lens — Observación cosmética, no diagnóstico médico.</p>
</div>`,
  },
  {
    name: "Newsletter",
    subject: "Tu guía de skincare del mes",
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<h1 style="color: #2F3A2D; font-size: 24px;">Guía de skincare</h1>
<p style="color: #64705E; font-size: 16px; line-height: 1.6;">Hola {name},</p>
<p style="color: #64705E; font-size: 16px; line-height: 1.6;">Aquí tienes los mejores consejos del mes:</p>
<div style="background: #F8FAF5; border-radius: 12px; padding: 20px; margin: 20px 0;">
<h3 style="color: #2F3A2D; margin-top: 0;">[Título del consejo]</h3>
<p style="color: #64705E; line-height: 1.6;">[Contenido del consejo]</p>
</div>
<div style="background: #F8FAF5; border-radius: 12px; padding: 20px; margin: 20px 0;">
<h3 style="color: #2F3A2D; margin-top: 0;">[Otro consejo]</h3>
<p style="color: #64705E; line-height: 1.6;">[Contenido del consejo]</p>
</div>
<a href="https://the-serene-lens-nuevo.onrender.com/blog" style="display: inline-block; background: #C2E09D; color: #2F3A2D; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Leer más artículos</a>
<p style="color: #64705E; font-size: 14px; margin-top: 24px;">The Serene Lens — Observación cosmética, no diagnóstico médico.</p>
</div>`,
  },
]

export default function AdminEmailsPage() {
  const { data: session, status } = useSession()
  const [counts, setCounts] = useState<RecipientCounts | null>(null)
  const [history, setHistory] = useState<EmailHistory | null>(null)
  const [segment, setSegment] = useState("all")
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")
  const [sending, setSending] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose")

  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "ADMIN") {
      redirect("/")
    }
  }, [session, status])

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/emails/history?limit=1")
      if (res.ok) {
        const data = await res.json()
        setCounts(data.recipientCounts)
      }
    } catch {}
  }, [])

  const loadHistory = useCallback(async (page = 1) => {
    try {
      const res = await fetch(`/api/admin/emails/history?page=${page}&limit=15`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
        if (!counts) setCounts(data.recipientCounts)
      }
    } catch {}
  }, [counts])

  useEffect(() => {
    if (status === "authenticated") {
      loadHistory()
    }
  }, [status, loadHistory])

  const applyTemplate = (template: (typeof TEMPLATES)[number]) => {
    setSubject(template.subject)
    setHtml(template.html)
  }

  const handleSend = async (isPreview: boolean) => {
    if (!subject.trim() || !html.trim()) {
      toast.error("Asunto y contenido son requeridos")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html,
          segment,
          preview: isPreview,
          previewEmail: isPreview ? session?.user?.email : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        if (isPreview) {
          toast.success("Vista previa enviada a tu correo")
        } else {
          toast.success(`Emails enviados: ${data.sent}, fallidos: ${data.failed}`)
          loadHistory()
        }
      } else {
        toast.error(data.error || "Error al enviar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSending(false)
    }
  }

  if (status === "loading" || !counts) {
    return (
      <div className="min-h-screen bg-[#F8FAF5] flex items-center justify-center">
        <p className="text-[#64705E]">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAF5]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[#64705E] hover:text-[#2F3A2D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al panel
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2F3A2D] flex items-center gap-3">
              <Mail className="w-8 h-8 text-[#C2E09D]" />
              Envío de Emails
            </h1>
            <p className="text-[#64705E] mt-1">
              Envía correos a tus usuarios por segmento
            </p>
          </div>
        </div>

        {/* Segment counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {Object.entries(counts).map(([key, value]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                segment === key
                  ? "ring-2 ring-[#C2E09D] bg-[#F0F5EC]"
                  : "hover:bg-[#F0F5EC]"
              }`}
              onClick={() => setSegment(key)}
            >
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-[#2F3A2D]">{value}</p>
                <p className="text-xs text-[#64705E]">{SEGMENT_LABELS[key]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "compose" ? "default" : "outline"}
            onClick={() => setActiveTab("compose")}
            className={activeTab === "compose" ? "bg-[#C2E09D] text-[#2F3A2D]" : ""}
          >
            <Send className="w-4 h-4 mr-2" />
            Redactar
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
            className={activeTab === "history" ? "bg-[#C2E09D] text-[#2F3A2D]" : ""}
          >
            <Clock className="w-4 h-4 mr-2" />
            Historial
          </Button>
        </div>

        {activeTab === "compose" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compose form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-[#2F3A2D] mb-4">
                    Redactar email
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2F3A2D] mb-1">
                        Segmento destino
                      </label>
                      <div className="px-3 py-2 bg-[#F8FAF5] border border-[#DDE7D3] rounded-lg text-[#2F3A2D]">
                        {SEGMENT_LABELS[segment]} — {counts[segment as keyof RecipientCounts]} destinatarios
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2F3A2D] mb-1">
                        Asunto
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2 border border-[#DDE7D3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2E09D] bg-white text-[#2F3A2D]"
                        placeholder="Asunto del email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2F3A2D] mb-1">
                        Contenido (HTML)
                      </label>
                      <textarea
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                        rows={12}
                        className="w-full px-4 py-2 border border-[#DDE7D3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2E09D] bg-white text-[#2F3A2D] font-mono text-sm resize-y"
                        placeholder="<h1>Hola</h1><p>Escribe tu contenido aquí...</p>"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleSend(false)}
                        disabled={sending || !subject.trim() || !html.trim()}
                        className="bg-[#C2E09D] text-[#2F3A2D] hover:bg-[#B0D48E]"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sending ? "Enviando..." : `Enviar a ${counts[segment as keyof RecipientCounts]} usuarios`}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSend(true)}
                        disabled={sending}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Vista previa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Templates sidebar */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-[#2F3A2D] mb-4">
                    Plantillas
                  </h2>
                  <div className="space-y-3">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left p-3 border border-[#DDE7D3] rounded-lg hover:bg-[#F0F5EC] transition-colors"
                      >
                        <p className="font-medium text-[#2F3A2D] text-sm">{t.name}</p>
                        <p className="text-xs text-[#64705E] mt-1 truncate">{t.subject}</p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-[#F8FAF5] rounded-lg">
                    <h3 className="text-sm font-medium text-[#2F3A2D] mb-2">
                      Variables disponibles
                    </h3>
                    <ul className="text-xs text-[#64705E] space-y-1">
                      <li><code className="bg-white px-1 rounded">{'{name}'}</code> — Nombre del usuario</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "history" && history && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-[#2F3A2D] mb-4">
                Historial de envíos ({history.pagination.total})
              </h2>

              {history.logs.length === 0 ? (
                <p className="text-[#64705E] text-center py-8">
                  No hay emails enviados aún
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#DDE7D3]">
                        <th className="text-left py-3 px-2 text-[#64705E] font-medium">Asunto</th>
                        <th className="text-left py-3 px-2 text-[#64705E] font-medium">Destinatario</th>
                        <th className="text-left py-3 px-2 text-[#64705E] font-medium">Segmento</th>
                        <th className="text-left py-3 px-2 text-[#64705E] font-medium">Estado</th>
                        <th className="text-left py-3 px-2 text-[#64705E] font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.logs.map((log) => (
                        <tr key={log.id} className="border-b border-[#DDE7D3] last:border-0">
                          <td className="py-3 px-2 text-[#2F3A2D] max-w-[200px] truncate">
                            {log.subject}
                          </td>
                          <td className="py-3 px-2 text-[#64705E] max-w-[180px] truncate">
                            {log.recipient}
                          </td>
                          <td className="py-3 px-2">
                            <span className="inline-block px-2 py-1 bg-[#F0F5EC] text-[#2F3A2D] rounded text-xs">
                              {SEGMENT_LABELS[log.segment] || log.segment}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            {log.status === "sent" ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </td>
                          <td className="py-3 px-2 text-[#64705E] text-xs">
                            {new Date(log.sentAt).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {history.pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: history.pagination.pages }, (_, i) => i + 1).map(
                    (p) => (
                      <Button
                        key={p}
                        variant={p === history.pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => loadHistory(p)}
                        className={p === history.pagination.page ? "bg-[#C2E09D] text-[#2F3A2D]" : ""}
                      >
                        {p}
                      </Button>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
