import { NextRequest, NextResponse } from "next/server"
import {
  handleStart, handleWeb, handlePrecios, handleStatusPublic,
  handleAyuda, handleSkincare, handleContacto,
  handleMeme, handleFeedback, handleReminder, handleRecomendar,
  handleValidatorAuth, handleValidar, handlePendientes,
  handleBuscar, handleHistorial, handleValidatorHelp,
  handleAdminAuth, handleActivar, handleCliente,
  handleReporte, handleUsuarios, handleAdminHelp,
  handleBroadcast, handleLogs, handleAlerta,
  handleTrending, handleAnalisis, handlePromocion,
  handleWhois,
  handleCallback,
} from "@/lib/telegram-handlers"
import { sendTelegramMessage } from "@/lib/telegram"

type TelegramUpdate = {
  message?: {
    chat: { id: number }
    from?: { id: number; username?: string; first_name?: string }
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
    await handleCallback(data, chatId, userId, messageId, callbackId)
    return NextResponse.json({ ok: true })
  }

  const msg = update.message
  if (!msg?.text) return NextResponse.json({ ok: true })
  const chatId = String(msg.chat.id)
  const userId = String(msg.from?.id || "")
  const username = msg.from?.username
  const args = msg.text.split(/\s+/)
  const command = args[0].toLowerCase()
  const rest = args.slice(1)

  switch (command) {
    // ─── Public ──────────────────────────────
    case "/start":
      await handleStart(chatId, userId, username)
      break
    case "/web":
      await handleWeb(chatId, userId)
      break
    case "/precios":
      await handlePrecios(chatId, userId)
      break
    case "/status":
      await handleStatusPublic(chatId, userId)
      break
    case "/ayuda":
    case "/help":
      await handleAyuda(chatId, userId)
      break
    case "/skincare":
    case "/tip":
      await handleSkincare(chatId, userId)
      break
    case "/contacto":
    case "/contact":
      await handleContacto(chatId, userId)
      break
    case "/meme":
      await handleMeme(chatId, userId)
      break
    case "/recomendar":
    case "/recommend":
      await handleRecomendar(chatId, userId)
      break
    case "/feedback":
      await handleFeedback(chatId, userId, rest)
      break
    case "/recordatorio":
      await handleReminder(chatId, userId, rest)
      break

    // ─── Validator Auth ───────────────────────
    case "/validator":
      await handleValidatorAuth(chatId, userId, rest)
      break
    case "/validatorhelp":
      await handleValidatorHelp(chatId, userId)
      break

    // ─── Validator / Admin ────────────────────
    case "/validar":
      await handleValidar(chatId, userId, rest)
      break
    case "/pendientes":
    case "/pending":
      await handlePendientes(chatId, userId)
      break
    case "/buscar":
    case "/search":
      await handleBuscar(chatId, userId, rest)
      break
    case "/historial":
    case "/history":
      await handleHistorial(chatId, userId, rest)
      break

    // ─── Admin Auth ───────────────────────────
    case "/admin":
      await handleAdminAuth(chatId, userId, rest)
      break
    case "/adminhelp":
      await handleAdminHelp(chatId, userId)
      break

    // ─── Admin only ───────────────────────────
    case "/activar":
    case "/activate":
      await handleActivar(chatId, userId, rest)
      break
    case "/cliente":
    case "/client":
      await handleCliente(chatId, userId, rest)
      break
    case "/reporte":
    case "/report":
      await handleReporte(chatId, userId)
      break
    case "/usuarios":
    case "/users":
      await handleUsuarios(chatId, userId)
      break
    case "/broadcast":
      await handleBroadcast(chatId, userId, rest)
      break
    case "/logs":
    case "/log":
      await handleLogs(chatId, userId, rest)
      break
    case "/alerta":
      await handleAlerta(chatId, userId, rest)
      break
    case "/trending":
      await handleTrending(chatId, userId)
      break
    case "/analisis":
    case "/analysis":
      await handleAnalisis(chatId, userId, rest)
      break
    case "/promocion":
    case "/promo":
      await handlePromocion(chatId, userId, rest)
      break
    case "/whois":
      await handleWhois(chatId, userId, rest)
      break

    default: {
      const text = (msg.text || "").toLowerCase()
      if (/precio|plan|cuesta|cuanto|cuesta/.test(text)) {
        await handlePrecios(chatId, userId)
      } else if (/web|sitio|página/.test(text)) {
        await handleWeb(chatId, userId)
      } else if (/hola|buenos|buenas/.test(text)) {
        await handleStart(chatId, userId, username)
      } else if (/gracias|ayuda|puedes/.test(text)) {
        await handleAyuda(chatId, userId)
      } else if (/estado|mi cuenta|cómo voy/.test(text)) {
        await handleStatusPublic(chatId, userId)
      } else if (/contacto|email|whatsapp|escribir/.test(text)) {
        await handleContacto(chatId, userId)
      } else {
        await sendTelegramMessage(chatId, "😅 No entendí bien. Puedes usar los botones o escribir /ayuda para ver qué puedo hacer.")
        await handleStart(chatId, userId, username)
      }
      break
    }
  }
  return NextResponse.json({ ok: true })
}
