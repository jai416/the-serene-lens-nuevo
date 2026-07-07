"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, AlertCircle, CheckCircle2, Mail, Clock, ExternalLink } from "lucide-react"
import { toast } from "sonner"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSending(true)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || data.error || "Error al enviar mensaje")
      }

      setSent(true)
      setForm({ name: "", email: "", subject: "", message: "" })
      toast.success("Mensaje enviado correctamente")
    } catch (e: any) {
      setError(e.message || "Error al enviar")
      toast.error(e.message || "Error al enviar mensaje")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: "#F8F9FA" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge
            variant="secondary"
            className="mb-4 rounded-full px-4 py-1.5"
            style={{ borderColor: "#E8E8E8", background: "#F8F9FA", color: "#666666" }}
          >
            <MessageCircle className="w-3.5 h-3.5 mr-2" />
            Contacto
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2" style={{ color: "#1A1A1A" }}>
            Contácta<span className="gradient-text">nos</span>
          </h1>
          <p style={{ color: "#666666" }} className="max-w-lg mx-auto">
            ¿Tienes preguntas, sugerencias o necesitas ayuda? Estamos aquí para ti.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Contact Info */}
          <div className="space-y-6">
            <Card style={{ borderColor: "#E8E8E8", background: "#FFFFFF" }}>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#88B078" }}
                  >
                    <Mail className="w-5 h-5" style={{ color: "#1A1A1A" }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1" style={{ color: "#1A1A1A" }}>Email</h3>
                    <p className="text-sm" style={{ color: "#666666" }}>contact@theserenelens.com</p>
                  </div>
                </div>

                <div className="border-t" style={{ borderColor: "#E8E8E8" }} />

                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#88B078" }}
                  >
                    <Clock className="w-5 h-5" style={{ color: "#1A1A1A" }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1" style={{ color: "#1A1A1A" }}>Tiempo de respuesta</h3>
                    <p className="text-sm" style={{ color: "#666666" }}>Te respondemos en 24-48 horas hábiles</p>
                  </div>
                </div>

                <div className="border-t" style={{ borderColor: "#E8E8E8" }} />

                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#88B078" }}
                  >
                    <MessageCircle className="w-5 h-5" style={{ color: "#1A1A1A" }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1" style={{ color: "#1A1A1A" }}>Contacto directo</h3>
                    <div className="flex flex-col gap-2 mt-2">
                      <a
                        href="https://t.me/theserenelens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex items-center gap-1.5 hover:underline"
                        style={{ color: "#666666" }}
                      >
                        Telegram <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://wa.me/5151819744"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex items-center gap-1.5 hover:underline"
                        style={{ color: "#666666" }}
                      >
                        WhatsApp <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="mailto:hereirajaison@gmail.com"
                        className="text-sm flex items-center gap-1.5 hover:underline"
                        style={{ color: "#666666" }}
                      >
                        Gmail <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl p-5" style={{ background: "#88B078" }}>
              <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Horario de atención</p>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "#666666" }}>
                Lunes a viernes: 9:00 – 18:00<br />
                Sábados: 10:00 – 14:00
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <Card style={{ borderColor: "#E8E8E8", background: "#FFFFFF" }}>
              <CardContent className="p-6 sm:p-8">
                {sent ? (
                  <div className="text-center py-10">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "#88B078" }}
                    >
                      <CheckCircle2 className="w-7 h-7" style={{ color: "#1A1A1A" }} />
                    </div>
                    <h2 className="font-serif text-xl font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                      ¡Mensaje enviado!
                    </h2>
                    <p className="text-sm mb-6" style={{ color: "#666666" }}>
                      Gracias por contactarnos. Te responderemos pronto.
                    </p>
                    <Button
                      onClick={() => setSent(false)}
                      variant="outline"
                      className="rounded-full"
                      style={{ borderColor: "#E8E8E8", color: "#1A1A1A" }}
                    >
                      Enviar otro mensaje
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div
                        className="flex items-center gap-2 p-4 rounded-xl text-sm"
                        style={{ background: "#FFF0F0", color: "#D32F2F" }}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block" style={{ color: "#1A1A1A" }}>
                          Nombre
                        </label>
                        <input
                          aria-label="Tu nombre"
                          placeholder="Tu nombre"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                          className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#88B078]"
                          style={{ borderColor: "#E8E8E8", background: "#F8F9FA", color: "#1A1A1A" }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block" style={{ color: "#1A1A1A" }}>
                          Email
                        </label>
                        <input
                          type="email"
                          aria-label="Tu email"
                          placeholder="tu@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                          className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#88B078]"
                          style={{ borderColor: "#E8E8E8", background: "#F8F9FA", color: "#1A1A1A" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: "#1A1A1A" }}>
                        Asunto
                      </label>
                      <input
                        aria-label="Asunto"
                        placeholder="¿Sobre qué quieres hablar?"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        required
                        className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#88B078]"
                        style={{ borderColor: "#E8E8E8", background: "#F8F9FA", color: "#1A1A1A" }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: "#1A1A1A" }}>
                        Mensaje
                      </label>
                      <textarea
                        aria-label="Mensaje"
                        placeholder="Escribe tu mensaje aquí..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                        rows={5}
                        className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#88B078] min-h-[120px] resize-none"
                        style={{ borderColor: "#E8E8E8", background: "#F8F9FA", color: "#1A1A1A" }}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={sending}
                      className="rounded-full w-full sm:w-auto border-0"
                      style={{ background: "#1A1A1A", color: "#F8F9FA" }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sending ? "Enviando..." : "Enviar mensaje"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
