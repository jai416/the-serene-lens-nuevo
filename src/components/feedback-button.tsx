"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, ThumbsUp, ThumbsDown, Send, X } from "lucide-react"
import { toast } from "sonner"

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"suggestion" | "bug" | "praise" | null>(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/feedback/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("¡Gracias por tu feedback! Ayudas a mejorar la app.")
      setOpen(false)
      setMessage("")
      setType(null)
    } catch {
      toast.error("No se pudo enviar. Intenta de nuevo.")
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-12 h-12 rounded-full bg-[#88B078] text-white shadow-lg flex items-center justify-center hover:bg-[#6F9A5E] transition-colors"
        aria-label="Enviar feedback"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 w-80 bg-white rounded-2xl shadow-xl border border-[#E8E8E8] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#E8E8E8]">
        <span className="text-sm font-semibold text-[#1A1A1A]">Tu opinión</span>
        <button onClick={() => setOpen(false)} aria-label="Cerrar">
          <X className="w-4 h-4 text-[#666666]" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        {!type ? (
          <div>
            <p className="text-xs text-[#666666] mb-3">¿Qué tipo de feedback quieres enviar?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setType("suggestion")}
                className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#F8F9FA] hover:bg-[#E2ECE0] transition-colors"
              >
                <ThumbsUp className="w-5 h-5 text-[#88B078]" />
                <span className="text-[10px] text-[#666666]">Sugerencia</span>
              </button>
              <button
                onClick={() => setType("bug")}
                className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#F8F9FA] hover:bg-[#FEF2F2] transition-colors"
              >
                <ThumbsDown className="w-5 h-5 text-[#E07070]" />
                <span className="text-[10px] text-[#666666]">Error</span>
              </button>
              <button
                onClick={() => setType("praise")}
                className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#F8F9FA] hover:bg-[#E2ECE0] transition-colors"
              >
                <ThumbsUp className="w-5 h-5 text-[#88B078]" />
                <span className="text-[10px] text-[#666666]">Me gusta</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#666666]">
              {type === "suggestion" && "¿Qué te gustaría que mejoremos?"}
              {type === "bug" && "¿Qué error encontraste?"}
              {type === "praise" && "¿Qué es lo que más te gusta?"}
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe aquí..."
              rows={3}
              className="w-full rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#666666]/50 focus:outline-none focus:ring-2 focus:ring-[#88B078] resize-none"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setType(null); setMessage("") }}
                disabled={sending}
              >
                Volver
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="ml-auto gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
