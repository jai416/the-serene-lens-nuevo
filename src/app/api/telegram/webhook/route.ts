import { NextRequest, NextResponse } from "next/server"
import {
  handleStart, handleHelp, handleStatus, handlePending,
  handleCliente, handleValidar, handleActivar, handleReporte,
  handleUsers, handleRevenue, handleAnalytics, handleBroadcast,
  handleCallback, handleBroadcastGo,
} from "@/lib/telegram-handlers"

type TelegramUpdate = {
  message?: {
    chat: { id: number }
    from?: { id: number }
    text?: string
  }
  callback_query?: {
    id: string
    data: string
    message: { chat: { id: number }; message_id: number }
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

  if (update.callback_query) {
    const cb = update.callback_query
    const chatId = String(cb.message.chat.id)
    const userId = String(cb.from?.id || "")
    const messageId = cb.message.message_id
    const callbackId = cb.id
    const data = cb.data

    if (data === "broadcast_go") {
      await handleBroadcastGo(chatId, userId)
      return NextResponse.json({ ok: true })
    }

    if (data === "broadcast_write") {
      const { sendTelegramMessage } = await import("@/lib/telegram")
      await sendTelegramMessage(chatId, "✏️ Escribe el mensaje que quieres enviar a todos los usuarios:")
      return NextResponse.json({ ok: true })
    }

    if (data.startsWith("activar_")) {
      const ref = data.replace("activar_", "")
      await handleActivar(chatId, userId, [ref, "--confirm"])
      const { answerCallback } = await import("@/lib/telegram")
      await answerCallback(chatId, callbackId, "✅ Activando...")
      return NextResponse.json({ ok: true })
    }

    await handleCallback(data, chatId, userId, messageId, callbackId)
    return NextResponse.json({ ok: true })
  }

  const msg = update.message
  if (!msg?.text) return NextResponse.json({ ok: true })
  const chatId = String(msg.chat.id)
  const userId = String(msg.from?.id || "")
  const args = msg.text.split(/\s+/)
  const command = args[0].toLowerCase()
  const rest = args.slice(1)

  switch (command) {
    case "/start":
      await handleStart(chatId, userId)
      break
    case "/help":
      await handleHelp(chatId, userId)
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
    case "/users":
      await handleUsers(chatId, userId)
      break
    case "/revenue":
      await handleRevenue(chatId, userId)
      break
    case "/analytics":
      await handleAnalytics(chatId, userId)
      break
    case "/broadcast":
      await handleBroadcast(chatId, userId, rest)
      break
    default:
      await handleStart(chatId, userId)
  }
  return NextResponse.json({ ok: true })
}
