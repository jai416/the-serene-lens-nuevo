const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN || ""}`

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
