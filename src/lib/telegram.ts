import { db } from "@/lib/db"

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN || ""}`

type InlineButton = { text: string; callback_data: string }
type InlineKeyboard = InlineButton[][]

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

export function isAdminTelegram(telegramId: string): boolean {
  const ids = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map(s => s.trim())
  return ids.includes(telegramId)
}

export function isValidatorTelegram(telegramId: string): boolean {
  const ids = (process.env.VALIDATOR_TELEGRAM_IDS || "").split(",").map(s => s.trim())
  return ids.includes(telegramId)
}

export function getUserRole(telegramId: string): "ADMIN" | "VALIDATOR" | null {
  if (isAdminTelegram(telegramId)) return "ADMIN"
  if (isValidatorTelegram(telegramId)) return "VALIDATOR"
  return null
}

export async function getUserByTelegramId(telegramId: string) {
  try {
    return await db.user.findFirst({ where: { telegramId } })
  } catch {
    return null
  }
}
