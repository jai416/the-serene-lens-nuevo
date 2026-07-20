import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { logger } from "@/lib/logger"

// ─── Rate limit (spam control) — Redis-backed ───────────────────
const CMD_COOLDOWN_MS = 4000
const PHOTO_COOLDOWN_MS = 60000

async function checkCooldown(chatId: string, isPhoto: boolean): Promise<{ allowed: boolean; message?: string }> {
  const { checkRateLimit } = await import("@/lib/rate-limit")
  const key = `cooldown:${isPhoto ? "photo" : "cmd"}:${chatId}`
  const result = await checkRateLimit(key, 1, isPhoto ? PHOTO_COOLDOWN_MS : CMD_COOLDOWN_MS)
  if (!result.allowed) {
    return {
      allowed: false,
      message: isPhoto
        ? "Asere, espera al menos 1 minuto entre cargas de fotos para cuidar la cola de procesamiento."
        : "Asere, vas muy rápido. Espera unos segundos antes de mandar otro comando."
    }
  }
  return { allowed: true }
}

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

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (expectedSecret) {
      const actualSecret = req.headers.get("x-telegram-bot-api-secret-token")
      if (actualSecret !== expectedSecret) {
        return NextResponse.json({ ok: false }, { status: 403 })
      }
    }

    const update: TelegramUpdate = await req.json()

    // Defer all processing to after() so Telegram gets a fast 200 OK
    after(async () => {
      try {
        await processUpdate(update)
      } catch (e) {
        logger.error("Telegram background processing error", {
          error: e instanceof Error ? e.message : String(e),
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    logger.error("Telegram webhook parse error", {
      error: e instanceof Error ? e.message : String(e),
    })
    // Always return 200 to prevent Telegram retries
    return NextResponse.json({ ok: true })
  }
}

async function processUpdate(update: TelegramUpdate) {
  const { sendTelegramMessage, sendTelegramMenu } = await import("@/lib/telegram")
  const { getUserRole } = await import("@/lib/telegram")
  const { checkRateLimit } = await import("@/lib/rate-limit")
  const { generateBotResponse } = await import("@/lib/bot-rag")
  const { searchWeb } = await import("@/lib/telegram-handlers")

  if (update.callback_query) {
    const { handleCallback } = await import("@/lib/telegram-handlers")
    const cb = update.callback_query
    const chatId = String(cb.message.chat.id)
    const userId = String(cb.from?.id || "")
    const messageId = cb.message.message_id
    const callbackId = cb.id
    const data = cb.data
    await handleCallback(data, chatId, userId, messageId, callbackId)
    return
  }

  const msg = update.message
  if (!msg?.text) return
  const chatId = String(msg.chat.id)

  const args = msg.text.split(/\s+/)
  const command = args[0].toLowerCase()
  const rest = args.slice(1)

  // Check cooldown via Redis
  const isPhoto = /foto|photo|img|image/i.test(msg.text)
  const cooldown = await checkCooldown(chatId, isPhoto)
  if (!cooldown.allowed) {
    await sendTelegramMessage(chatId, cooldown.message!)
    return
  }

  // Check access for restricted commands
  if (COMMANDS_REQUIRING_ACCESS.has(command)) {
    const access = await checkTelegramAccess(chatId)
    if (!access.allowed) {
      await sendTelegramMessage(chatId, access.message!)
      return
    }
  }

  const userId = String(msg.from?.id || "")
  const username = msg.from?.username

  const {
    handleStart, handleWeb, handlePrecios, handleStatusPublic,
    handleAyuda, handleSkincare, handleContacto,
    handleMeme, handleFeedback, handleReminder, handleRecomendar,
    handleValidatorAuth, handleValidar, handlePendientes,
    handleBuscar, handleHistorial, handleValidatorHelp,
    handleAdminAuth, handleActivar, handleCliente,
    handleReporte, handleUsuarios, handleAdminHelp,
    handleBroadcast, handleLogs, handleAlerta,
    handleTrending, handleAnalisis, handlePromocion,
    handleWhois, handleConsultar,
    handleMiRutina, handleDiario, handleTestPiel, handleTestPielAnswer,
    handleAsistente,
  } = await import("@/lib/telegram-handlers")

  switch (command) {
    // ─── Public ──────────────────────────────
    case "/start":
      await handleStart(chatId, userId, username)
      break
    case "/test_piel":
    case "/test-piel":
      await handleTestPiel(chatId, userId)
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
    case "/mi_rutina":
    case "/mi-rutina":
      await handleMiRutina(chatId, userId)
      break
    case "/diario":
      await handleDiario(chatId, userId)
      break
    case "/asistente":
    case "/ai":
    case "/chat":
      await handleAsistente(chatId, userId, rest)
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
    case "/consultar": {
      const rl = await checkRateLimit(`bot-consultar:${chatId}`, 10, 60000)
      if (!rl.allowed) {
        await sendTelegramMessage(chatId, "⏳ Has usado muchas consultas. Espera un minuto antes de preguntar de nuevo.")
        return
      }
      await handleConsultar(chatId, userId, rest)
      break
    }

    default: {
      // Check if user is in test_piel flow
      const handledTest = await handleTestPielAnswer(chatId, msg.text)
      if (handledTest) return

      const parsedSms = parseTransferSms(msg.text)
      if (parsedSms) {
        const role = await getUserRole(chatId)
        if (role === "VALIDATOR" || role === "ADMIN") {
          await sendTelegramMessage(chatId,
            `🔄 Transferencia detectada:\nCódigo: <code>${parsedSms.reference}</code>\nMonto: $${parsedSms.amount.toFixed(2)}\nFecha: ${parsedSms.date}\n\n¿Validar este pago?`,
          )
          await sendTelegramMenu(chatId, "Selecciona una acción:", [
            [{ text: "✅ Confirmar Pago", callback_data: `validar_ref_${parsedSms.reference}` }],
            [{ text: "❌ Rechazar", callback_data: "rechazar" }],
          ])
          return
        }
      }

      const text = (msg.text || "").toLowerCase()
      if (/precio|plan|cuesta|cuanto|cuesta/.test(text)) {
        await handlePrecios(chatId, userId)
      } else if (/web|sitio|página/.test(text)) {
        await handleWeb(chatId, userId)
      } else if (/hola|buenos|buenas/.test(text)) {
        await handleStart(chatId, userId, username)
      } else if (/gracias|ayuda|puedes/.test(text)) {
        await handleAyuda(chatId, userId)
      } else if (/estado|mi cuenta|cómo voy|cómo voy/.test(text)) {
        await handleStatusPublic(chatId, userId)
      } else if (/contacto|email|whatsapp|escribir/.test(text)) {
        await handleContacto(chatId, userId)
      } else if (/tip|skincare|consejo/.test(text)) {
        await handleSkincare(chatId, userId)
      } else if (/recomendar|amigo|invitar/.test(text)) {
        await handleRecomendar(chatId, userId)
      } else if (/valorar|feedback|opinión/.test(text)) {
        await handleFeedback(chatId, userId, [])
      } else if (/recordatorio|recordar/.test(text)) {
        await handleReminder(chatId, userId, [])
      } else if (/meme|risa|jaja/.test(text)) {
        await handleMeme(chatId, userId)
      } else if (/test piel|test_piel|diagnóstico/.test(text)) {
        await handleTestPiel(chatId, userId)
      } else if (/mi rutina|mi_rutina|rutina/.test(text)) {
        await handleMiRutina(chatId, userId)
      } else if (/diario|historial|últimos/.test(text)) {
        await handleDiario(chatId, userId)
      } else {
        const role = await getUserRole(chatId)
        if (role) {
          const rl = await checkRateLimit(`bot-rag:${chatId}`, 20, 60000)
          if (!rl.allowed) {
            await sendTelegramMessage(chatId, "⏳ Has hecho muchas preguntas. Espera un momento antes de seguir.")
            return
          }
          const response = await generateBotResponse(msg.text || "", chatId, username)
          let resultText = response.text
          if (role === "ADMIN" || role === "VALIDATOR") {
            const webResults = await searchWeb(msg.text || "")
            if (webResults) {
              resultText += "\n\n🌐 <b>Resultados de búsqueda web:</b>\n\n" + webResults
            }
          }
          const buttons = response.knowledgeId
            ? [[{ text: "👍 Útil", callback_data: `rag_feedback_${response.knowledgeId}_1` }]]
            : undefined
          if (buttons) {
            await sendTelegramMenu(chatId, resultText, buttons)
          } else {
            await sendTelegramMessage(chatId, resultText)
          }
        } else {
          await sendTelegramMessage(chatId, "😅 No entendí bien. Puedes usar los botones o escribir /ayuda para ver qué puedo hacer.")
          await handleStart(chatId, userId, username)
        }
      }
      break
    }
  }
}

// ─── TransferSMS auto-detection ─────────────────────────────────
const TRANSFER_SMS_REGEX = /Transfermovil\s+Codigo:\s*(\w+)\s+Monto:\s*([\d.,]+)\s+(?:USD|CUP)\s+Fecha:\s*(\d{2}\/\d{2}\/\d{2,4})/i

function parseTransferSms(text: string): { reference: string; amount: number; date: string } | null {
  const match = text.match(TRANSFER_SMS_REGEX)
  if (!match) return null
  return {
    reference: match[1],
    amount: parseFloat(match[2].replace(",", ".")),
    date: match[3],
  }
}

// ─── TelegramAccess helpers ─────────────────────────────────────
async function checkTelegramAccess(chatId: string): Promise<{ allowed: boolean; message?: string }> {
  const { db } = await import("@/lib/db")
  const user = await db.user.findFirst({ where: { telegramId: chatId } })
  if (!user) return { allowed: true }

  if (user.role === "ADMIN" || user.role === "ESTHETICIAN" || user.plan === "ESTHETICIAN") return { allowed: true }
  if (["PREMIUM", "PRO", "PRO_PLUS"].includes(user.plan)) return { allowed: true }
  if (user.isTelegramPremiumActive) return { allowed: true }

  if (!user.telegramTrialStartedAt) {
    await db.user.update({ where: { id: user.id }, data: { telegramTrialStartedAt: new Date() } })
    return { allowed: true }
  }

  const hoursSinceTrial = (Date.now() - user.telegramTrialStartedAt.getTime()) / 3600000
  if (hoursSinceTrial < 72) return { allowed: true }

  return {
    allowed: false,
    message: "Asere, tu prueba gratuita de 3 días en Telegram ha terminado. Para seguir disfrutando de la comodidad de gestionar tu piel directamente desde el chat sin consumir tus megas navegando, activa tu Plan Premium. Si prefieres seguir gratis, puedes usar nuestra plataforma web en cualquier momento."
  }
}

const COMMANDS_REQUIRING_ACCESS = new Set([
  "/mi_rutina", "/diario", "/analisis", "/analysis",
  "/status", "/historial", "/history", "/asistente",
])
