"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function UnsubscribePage() {
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason: reason || undefined }),
      })

      if (res.ok) {
        setStatus("success")
        setMessage("Te has dado de baja correctamente. No recibirás más correos de marketing.")
      } else {
        setStatus("error")
        setMessage("Error al procesar la solicitud. Intenta de nuevo.")
      }
    } catch {
      setStatus("error")
      setMessage("Error de conexión. Intenta de nuevo.")
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#2F3A2D] mb-2">
            Darse de baja
          </h1>
          <p className="text-[#64705E]">
            Lamentamos que te vayas. Puedes darte de baja del correo electrónico en cualquier momento.
          </p>
        </div>

        {status === "success" ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#C2E09D] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#2F3A2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[#2F3A2D] font-medium">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2F3A2D] mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-[#DDE7D3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2E09D] bg-white text-[#2F3A2D]"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-[#2F3A2D] mb-1">
                Razón (opcional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-[#DDE7D3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2E09D] bg-white text-[#2F3A2D] resize-none"
                placeholder="¿Por qué te das de baja?"
              />
            </div>

            {status === "error" && (
              <p className="text-red-600 text-sm">{message}</p>
            )}

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-[#C2E09D] text-[#2F3A2D] hover:bg-[#B0D48E]"
            >
              {status === "loading" ? "Procesando..." : "Darme de baja"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-[#64705E] hover:text-[#2F3A2D]">
            Volver a The Serene Lens
          </a>
        </div>
      </Card>
    </div>
  )
}
