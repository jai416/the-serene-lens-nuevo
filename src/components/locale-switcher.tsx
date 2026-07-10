"use client"

import { useLocale } from "@/lib/locale/locale-context"
import { useSession } from "next-auth/react"

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setLocale("es")}
        className={`text-xs px-2 py-1 rounded-md transition-colors ${
          locale === "es"
            ? "bg-[#88B078] text-white font-medium"
            : "text-[#666666] hover:text-[#1A1A1A]"
        }`}
        aria-label="Español"
      >
        ES
      </button>
      <span className="text-[#E8E8E8]">|</span>
      <button
        onClick={() => setLocale("en")}
        className={`text-xs px-2 py-1 rounded-md transition-colors ${
          locale === "en"
            ? "bg-[#88B078] text-white font-medium"
            : "text-[#666666] hover:text-[#1A1A1A]"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  )
}
