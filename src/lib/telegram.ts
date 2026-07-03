import { db } from "@/lib/db"

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN || ""}`

type InlineButton = { text: string; callback_data?: string; url?: string }
type InlineKeyboard = InlineButton[][]
type KeyboardButton = { text: string }
type ReplyKeyboard = KeyboardButton[][]

export async function sendTelegramMessage(chatId: string | number, text: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
  if (!process.env.TELEGRAM_TOKEN) return false
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: String(chatId), text, parse_mode: parseMode }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendTelegramMenu(
  chatId: string | number,
  text: string,
  buttons: InlineKeyboard,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  if (!process.env.TELEGRAM_TOKEN) return false
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId),
        text,
        parse_mode: parseMode,
        reply_markup: { inline_keyboard: buttons },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendTelegramKeyboard(
  chatId: string | number,
  text: string,
  buttons: ReplyKeyboard,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  if (!process.env.TELEGRAM_TOKEN) return false
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId),
        text,
        parse_mode: parseMode,
        reply_markup: {
          keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: false,
          input_field_placeholder: "Escribe un comando...",
        },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function removeKeyboard(chatId: string | number, text: string): Promise<boolean> {
  if (!process.env.TELEGRAM_TOKEN) return false
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId),
        text,
        reply_markup: { remove_keyboard: true },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function editTelegramMenu(
  chatId: string | number,
  messageId: number,
  text: string,
  buttons: InlineKeyboard,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  if (!process.env.TELEGRAM_TOKEN) return false
  try {
    const res = await fetch(`${TELEGRAM_API}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId),
        message_id: messageId,
        text,
        parse_mode: parseMode,
        reply_markup: { inline_keyboard: buttons },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function answerCallback(chatId: string | number, callbackQueryId: string, text?: string): Promise<boolean> {
  if (!process.env.TELEGRAM_TOKEN) return false
  try {
    const res = await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendTelegramToGroup(text: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
  const groupId = process.env.TELEGRAM_GROUP_ID
  if (!groupId) return false
  return sendTelegramMessage(groupId, text, parseMode)
}

// ===== DB Auth =====

export async function authAdmin(chatId: string, token: string): Promise<boolean> {
  const adminToken = process.env.TELEGRAM_ADMIN_TOKEN
  if (!adminToken || token !== adminToken) return false
  try {
    await db.telegramAuth.upsert({
      where: { chatId },
      update: { role: "ADMIN" },
      create: { chatId, role: "ADMIN" },
    })
    return true
  } catch {
    return false
  }
}

export async function authValidator(chatId: string, token: string): Promise<boolean> {
  const validatorToken = process.env.TELEGRAM_VALIDATOR_TOKEN
  if (!validatorToken || token !== validatorToken) return false
  try {
    await db.telegramAuth.upsert({
      where: { chatId },
      update: { role: "VALIDATOR" },
      create: { chatId, role: "VALIDATOR" },
    })
    return true
  } catch {
    return false
  }
}

export async function getUserRole(chatId: string): Promise<"ADMIN" | "VALIDATOR" | null> {
  try {
    const auth = await db.telegramAuth.findUnique({ where: { chatId } })
    return auth?.role as "ADMIN" | "VALIDATOR" | null
  } catch {
    return null
  }
}

// ===== Logging =====

export async function logTelegramCommand(chatId: string, command: string, args: string | null, role: string | null, username?: string) {
  try {
    await db.telegramLog.create({
      data: { chatId, command, args, role, username: username || null },
    })
  } catch {
  }
}

export async function getTelegramLogs(fecha?: string): Promise<string[]> {
  try {
    const where: any = {}
    if (fecha) {
      const start = new Date(fecha)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      where.createdAt = { gte: start, lt: end }
    }
    const logs = await db.telegramLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return logs.map(l =>
      `[${l.createdAt.toLocaleString("es-ES")}] ${l.role || "PUBLIC"} ${l.chatId}: /${l.command}${l.args ? " " + l.args : ""}`
    )
  } catch {
    return ["Error al obtener logs"]
  }
}

// ===== Alerts =====

export async function setAlertSub(chatId: string, events: string[]): Promise<void> {
  await db.telegramAlert.upsert({
    where: { chatId },
    update: { events: JSON.stringify(events) },
    create: { chatId, events: JSON.stringify(events) },
  })
}

export async function getAlertSub(chatId: string): Promise<string[]> {
  try {
    const sub = await db.telegramAlert.findUnique({ where: { chatId } })
    return sub ? JSON.parse(sub.events) : []
  } catch {
    return []
  }
}

export async function notifyAdmins(event: string, message: string): Promise<void> {
  const admins = await db.telegramAuth.findMany({ where: { role: "ADMIN" } })
  for (const a of admins) {
    const sub = await getAlertSub(a.chatId)
    if (sub.includes(event) || sub.includes("*")) {
      await sendTelegramMessage(a.chatId, message)
    }
  }
}

// ===== Reminders =====

export async function setReminder(chatId: string, userId: string | null, active: boolean): Promise<void> {
  await db.telegramReminder.upsert({
    where: { chatId },
    update: { active, userId },
    create: { chatId, userId, active },
  })
}

export async function getReminderStatus(chatId: string): Promise<boolean> {
  try {
    const r = await db.telegramReminder.findUnique({ where: { chatId } })
    return r?.active ?? false
  } catch {
    return false
  }
}

// ===== Discount Codes =====

export async function generateDiscountCode(discount: number, createdBy: string, maxUses = 1): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  const code = `SERENE${discount}-${suffix}`
  await db.discountCode.create({
    data: { code, discount, maxUses, createdBy },
  })
  return code
}

export async function validateDiscountCode(code: string): Promise<{ valid: boolean; discount?: number; error?: string }> {
  const dc = await db.discountCode.findUnique({ where: { code: code.toUpperCase() } })
  if (!dc) return { valid: false, error: "Código no encontrado" }
  if (!dc.active) return { valid: false, error: "Código desactivado" }
  if (dc.usedCount >= dc.maxUses) return { valid: false, error: "Código agotado" }
  if (dc.expiresAt && dc.expiresAt < new Date()) return { valid: false, error: "Código expirado" }
  return { valid: true, discount: dc.discount }
}

// ===== Feedback =====

export async function saveFeedback(chatId: string, rating: number, userId?: string): Promise<void> {
  await db.botFeedback.create({ data: { chatId, userId, rating } })
}

export async function getFeedbackAvg(): Promise<{ avg: number; count: number }> {
  const result = await db.botFeedback.aggregate({ _avg: { rating: true }, _count: { rating: true } })
  return { avg: result._avg.rating || 0, count: result._count.rating }
}

// ===== Memes =====

const MEMES = [
  "🧴 *Antes de The Serene Lens:* Usaba cualquier crema.\n*Ahora:* Analizo mi piel con IA como una científica de datos. 🔬",
  "☀️ *Tu piel cuando no usas protector solar:* 🍳🔥\n*Con SPF 50:* 🧊❄️",
  "🙈 *Yo viendo mi foto sin filtro:* ¿Quién es esa?\n*The Serene Lens:* Déjame analizar tu tipo de piel...",
  "💸 *Gastar en 10 cremas que no funcionan:* $200\n*The Serene Lens:* $4.99 y sabes exactamente lo que necesitas. 🧠",
  "😴 *Rutina de 12 pasos:* Agotador.\n*Rutina inteligente:* 3 pasos, los correctos. ✨",
  "🧐 *Cuando alguien dice 'mi piel es resistente':*\nThe Serene Lens: *foto frontal, izquierda, derecha* Ya veremos... 📸",
  "🫠 *Ese grano que aparece justo antes de una cita:*\nThe Serene Lens: *aplicando ácido salicílico* No te preocupes. 🧪",
  "👀 *Tu amiga te recomienda una crema:*\nTú: *corriendo a The Serene Lens para ver si es segura*",
  "🎯 *The Serene Lens:* No tenemos porcentajes inventados.\n*Otros bots:* 'Tu piel es 73% grasa' 🤨",
  "📊 *Análisis de piel:*\nTú: ¿Seca? ¿Grasa?\nThe Serene Lens: Mixta con tendencia a deshidratación. Permíteme explicarte...",
]

export function getRandomMeme(): string {
  return MEMES[Math.floor(Math.random() * MEMES.length)]
}
