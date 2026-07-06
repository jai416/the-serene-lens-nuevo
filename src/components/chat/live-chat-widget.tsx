'use client'

import { useState } from "react"
import { MessageCircle, Send, Phone } from "lucide-react"

const TELEGRAM_LINK = "https://t.me/theserenelens"
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+5355555555"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, "")}`

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#88B078] text-2xl shadow-lg hover:bg-[#B0CF8D] transition-colors"
        aria-label="Contactar"
      >
        <MessageCircle className="w-6 h-6 text-[#1A1A1A]" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-auto w-[300px] flex-col rounded-2xl border border-[#E8E8E8] bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-[#88B078] p-3 font-semibold text-[#1A1A1A]">
            <span>💬 Contáctanos</span>
            <button onClick={() => setOpen(false)} className="text-lg leading-none">✕</button>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm text-[#666666] text-center">
              ¿Tienes dudas? Escríbenos directo por estos canales:
            </p>

            <a
              href={TELEGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-[#F8F9FA] border border-[#E8E8E8] hover:bg-[#E2ECE0] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#88B078] flex items-center justify-center">
                <Send className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#1A1A1A]">Telegram</p>
                <p className="text-xs text-[#666666]">Respuesta rápida</p>
              </div>
            </a>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-[#F8F9FA] border border-[#E8E8E8] hover:bg-[#E2ECE0] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#88B078] flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#1A1A1A]">WhatsApp</p>
                <p className="text-xs text-[#666666]">Atención personalizada</p>
              </div>
            </a>
          </div>
        </div>
      )}
    </>
  )
}
