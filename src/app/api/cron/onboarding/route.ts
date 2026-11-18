import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { verifyCronSecret } from "@/lib/cron-auth"
import { sendTelegramMessage } from "@/lib/telegram"

export const runtime = "nodejs"

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Secuencia de bienvenida por Telegram (retención + conversión).
 *
 * Para cada chat que inició con /start y AÚN no ha enviado fotos:
 *   - Día 1+: tip de skincare + recordatorio de /analizar   (tip1)
 *   - Día 3+: CTA final con el enlace de registro            (tip2)
 *
 * Deduplicación: cada envío queda registrado en TelegramLog
 * (command onboarding_tip1 / onboarding_tip2) y no se repite.
 */
export async function GET(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const now = new Date()

    const [starts, analyzed, tip1Sent, tip2Sent] = await Promise.all([
      // primer /start de cada chat
      db.telegramLog.findMany({
        where: { command: "start" },
        select: { chatId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      db.telegramLog.findMany({
        where: { command: { in: ["foto", "listo"] } },
        select: { chatId: true },
      }),
      db.telegramLog.findMany({
        where: { command: "onboarding_tip1" },
        select: { chatId: true },
      }),
      db.telegramLog.findMany({
        where: { command: "onboarding_tip2" },
        select: { chatId: true },
      }),
    ])

    // primer /start por chat (el findMany puede traer varios)
    const firstStart = new Map<string, Date>()
    for (const s of starts) {
      if (!firstStart.has(s.chatId)) firstStart.set(s.chatId, s.createdAt)
    }
    const analyzedChats = new Set(analyzed.map((a) => a.chatId))
    const tip1Chats = new Set(tip1Sent.map((a) => a.chatId))
    const tip2Chats = new Set(tip2Sent.map((a) => a.chatId))

    const tip1 = `Un tip rápido para tu piel en clima húmedo:

• Limpia tu rostro 2 veces al día, aunque no uses maquillaje
• Usa protector solar aunque esté nublado (la radiación UV no pide permiso)
• Si tu piel brilla por la tarde, un pañito absorbente sin tocar el maquillaje

Si aún no has probado tu análisis con IA, escribe /analizar y envíame una foto de tu rostro. Te toma 30 segundos.`

    const tip2 = `Tu análisis de piel sigue esperándote.

Envíame una foto frontal de tu rostro (buena luz, sin filtros) y recibe:
• Tipo de piel y observaciones reales
• Rutina de mañana y noche personalizada
• Recomendaciones con ingredientes

Escribe /analizar para empezar. Y si quieres guardar tu historial y ver cómo evoluciona tu piel, crea tu cuenta gratis en la web.`

    let sent1 = 0
    let sent2 = 0
    let skipped = 0

    for (const [chatId, startedAt] of firstStart) {
      if (analyzedChats.has(chatId)) continue

      const daysSinceStart = Math.floor((now.getTime() - startedAt.getTime()) / DAY_MS)

      try {
        if (daysSinceStart >= 3 && !tip2Chats.has(chatId)) {
          await sendTelegramMessage(chatId, tip2)
          await db.telegramLog.create({
            data: { chatId, command: "onboarding_tip2", role: null },
          })
          sent2++
        } else if (daysSinceStart >= 1 && !tip1Chats.has(chatId)) {
          await sendTelegramMessage(chatId, tip1)
          await db.telegramLog.create({
            data: { chatId, command: "onboarding_tip1", role: null },
          })
          sent1++
        } else {
          skipped++
        }
      } catch (e) {
        logger.error("Onboarding send failed", {
          chatId,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    logger.info("Telegram onboarding completed", { sent1, sent2, skipped })
    return NextResponse.json({ sent1, sent2, skipped })
  } catch (e) {
    logger.error("Onboarding cron failed", {
      error: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
