import { NextRequest, NextResponse } from "next/server"
import { handleStart, handleStatus, handlePending, handleCliente, handleValidar, handleActivar, handleReporte } from "@/lib/telegram-handlers"

type TelegramUpdate = {
  message?: {
    chat: { id: number }
    from?: { id: number }
    text?: string
  }
  callback_query?: {
    data: string
    message: { chat: { id: number } }
    from?: { id: number }
  }
}

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (expectedSecret) {
    const actualSecret = req.headers.get("x-telegram-bot-api-secret-token")
    if (actualSecret !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 403 })
    }
  }

  const update: TelegramUpdate = await req.json()
  const msg = update.message
  if (!msg?.text) return NextResponse.json({ ok: true })
  const chatId = String(msg.chat.id)
  const userId = String(msg.from?.id || "")
  const args = msg.text.split(/\s+/)
  const command = args[0].toLowerCase()
  const rest = args.slice(1)
  switch (command) {
    case "/start":
    case "/help":
      await handleStart(chatId, userId)
      break
    case "/status":
      await handleStatus(chatId, userId)
      break
    case "/pending":
      await handlePending(chatId, userId)
      break
    case "/cliente":
      await handleCliente(chatId, userId, rest)
      break
    case "/validar":
      await handleValidar(chatId, userId, rest)
      break
    case "/activar":
      await handleActivar(chatId, userId, rest)
      break
    case "/reporte":
      await handleReporte(chatId, userId)
      break
  }
  return NextResponse.json({ ok: true })
}
