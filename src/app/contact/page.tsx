"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, AlertCircle, CheckCircle2, Mail, MapPin, Clock } from "lucide-react"
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
        throw new Error(data.error || "Error al enviar mensaje")
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
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <MessageSquare className="w-3.5 h-3.5 mr-2" />
            Contacto
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2">
            Contácta<span className="gradient-text">nos</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            ¿Tienes preguntas, sugerencias o necesitas ayuda? Estamos aquí para ti.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-sm mb-1">Email</h3>
                <p className="text-xs text-muted-foreground">contact@theserenelens.com</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-sm mb-1">Respuesta</h3>
                <p className="text-xs text-muted-foreground">Te respondemos en 24-48 horas hábiles</p>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6 sm:p-8">
                {sent ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    </div>
                    <h2 className="font-serif text-xl font-semibold mb-2">¡Mensaje enviado!</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Gracias por contactarnos. Te responderemos pronto.
                    </p>
                    <Button onClick={() => setSent(false)} variant="outline" className="rounded-full">
                      Enviar otro mensaje
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Nombre</label>
                        <input
                          placeholder="Tu nombre"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Email</label>
                        <input
                          type="email"
                          placeholder="tu@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Asunto</label>
                      <input
                        placeholder="¿Sobre qué quieres hablar?"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        required
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Mensaje</label>
                      <textarea
                        placeholder="Escribe tu mensaje aquí..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                        rows={5}
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px] resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={sending}
                      className="rounded-full gradient-primary text-white w-full sm:w-auto"
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
