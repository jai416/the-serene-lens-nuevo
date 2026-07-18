"use client"

import { useState, useEffect } from "react"
import { Sparkles, X } from "lucide-react"

const ANNOUNCEMENTS: Record<string, { es: string; en: string }> = {
  "v3.1-ai": {
    es: "Nuevo: La IA ahora recuerda tu último análisis para darte seguimiento personalizado.",
    en: "New: AI now remembers your last analysis for personalized follow-up.",
  },
  "v3.1-weather": {
    es: "Nuevo: Las rutinas se ajustan al clima real de tu ubicación.",
    en: "New: Routines now adapt to your real-time local weather.",
  },
  "v3.1-ingredients": {
    es: "Nuevo: El analizador de ingredientes se adapta a tu tipo de piel.",
    en: "New: Ingredient analyzer now adapts to your skin type.",
  },
}

export function WhatsNewBanner({ locale }: { locale: string }) {
  const [dismissed, setDismissed] = useState(true)
  const [currentKey, setCurrentKey] = useState<string | null>(null)

  useEffect(() => {
    const seen = JSON.parse(localStorage.getItem("whatsnew_seen") || "[]") as string[]
    const keys = Object.keys(ANNOUNCEMENTS)
    const unseen = keys.find((k) => !seen.includes(k))
    if (unseen) {
      setCurrentKey(unseen)
      setDismissed(false)
    }
  }, [])

  if (dismissed || !currentKey) return null

  const handleDismiss = () => {
    const seen = JSON.parse(localStorage.getItem("whatsnew_seen") || "[]") as string[]
    seen.push(currentKey)
    localStorage.setItem("whatsnew_seen", JSON.stringify(seen))
    setDismissed(true)
  }

  const message = ANNOUNCEMENTS[currentKey]
  if (!message) return null

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#E2ECE0] to-[#F0F7EE] border border-[#88B078]/20 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#88B078]/20 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-[#88B078]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A1A1A]">
            {locale === "en" ? "What's New" : "Novedades"}
          </p>
          <p className="text-xs text-[#666666] mt-0.5">
            {locale === "en" ? message.en : message.es}
          </p>
        </div>
        <button onClick={handleDismiss} aria-label="Cerrar" className="shrink-0">
          <X className="w-4 h-4 text-[#666666] hover:text-[#1A1A1A]" />
        </button>
      </div>
    </div>
  )
}
