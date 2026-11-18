"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/csrf-client"
import { errMessage } from "@/lib/api-response"

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Nombre, email y mensaje son requeridos")
      return
    }
    setSending(true)
    try {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(errMessage(d, "No se pudo enviar el mensaje"))
      }
      setSent(true)
      setForm({ name: "", email: "", subject: "", message: "" })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el mensaje")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <Card className="border-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-gradient-to-br from-[#E2ECE0] to-white">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#88B078] mx-auto mb-3" />
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-2">
            Mensaje enviado
          </h2>
          <p className="text-sm text-[#666666] mb-5">
            Te responderemos en 24-48 horas al email que nos dejaste.
          </p>
          <Button variant="secondary" onClick={() => setSent(false)}>
            Enviar otro mensaje
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <CardContent className="p-6 sm:p-8">
        <h2 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-1">
          Escríbenos
        </h2>
        <p className="text-sm text-[#666666] mb-5">
          Dudas sobre tu análisis, tu plan o cualquier sugerencia.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Nombre *
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Email *
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-subject" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Asunto
            </label>
            <input
              id="contact-subject"
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
              placeholder="¿En qué podemos ayudarte?"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
              Mensaje *
            </label>
            <textarea
              id="contact-message"
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078] resize-y"
              placeholder="Cuéntanos..."
            />
          </div>

          <Button type="submit" variant="primary" disabled={sending} className="w-full sm:w-auto">
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {sending ? "Enviando..." : "Enviar mensaje"}
          </Button>

          <p className="flex items-start gap-2 text-xs text-[#999999] pt-1">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Este no es un canal de urgencias médicas. Para una urgencia dermatológica,
            contacta a un profesional de la salud.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
