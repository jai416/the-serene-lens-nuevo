"use client"

import { useState } from "react"
import { Star, MessageSquare, Send } from "lucide-react"

export function SatisfactionSurvey() {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      await fetch("/api/feedback/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-[#E8E8E8] p-6 text-center">
        <div className="w-12 h-12 bg-[#E2ECE0] rounded-full flex items-center justify-center mx-auto mb-3">
          <Star className="w-6 h-6 text-[#1A1A1A]" />
        </div>
        <p className="text-[#1A1A1A] font-medium">¡Gracias por tu feedback!</p>
        <p className="text-xs text-[#666666] mt-1">Nos ayuda a mejorar tu experiencia.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E8E8] p-6">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-[#88B078]" />
        <h3 className="text-sm font-medium text-[#1A1A1A]">¿Cómo fue tu experiencia?</h3>
      </div>

      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
              rating === star
                ? "bg-[#88B078] text-[#1A1A1A] shadow-[0_2px_8px_rgba(194,224,157,0.3)]"
                : "bg-[#F8F9FA] text-[#666666] hover:bg-[#E2ECE0]"
            }`}
          >
            {star}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="¿Qué podemos mejorar? (opcional)"
        className="w-full border border-[#E8E8E8] rounded-xl p-3 text-sm text-[#1A1A1A] placeholder:text-[#999999] mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#88B078]"
        rows={2}
      />

      <button
        onClick={handleSubmit}
        disabled={!rating || submitting}
        className="inline-flex items-center gap-2 px-5 py-2 bg-[#88B078] text-[#1A1A1A] rounded-full text-sm font-semibold hover:bg-[#78A068] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(194,224,157,0.3)]"
      >
        <Send className="w-3.5 h-3.5" />
        {submitting ? "Enviando..." : "Enviar"}
      </button>
    </div>
  )
}
