import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, unauthorized, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) return unauthorized()

    const users = await db.user.findMany({
      where: {
        plan: { in: ["PREMIUM", "PRO", "PRO_PLUS"] },
        telegramId: { not: null },
        latitude: { not: null },
        longitude: { not: null },
      },
      select: { telegramId: true, latitude: true, longitude: true, name: true },
    })

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return error("TELEGRAM_BOT_TOKEN no configurado")

    let notified = 0

    for (const user of users) {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${user.latitude}&longitude=${user.longitude}&daily=uv_index_max&timezone=auto`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (!res.ok) continue

        const data = await res.json()
        const uvMax: number | undefined = data.daily?.uv_index_max?.[0]
        if (uvMax == null || uvMax < 8) continue

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.telegramId,
            text: `☀️ Asere, el índice UV en tu zona hoy es de ${uvMax}. El sol está extremo, no olvides tu protector solar de mañana y reponerlo cada 2 horas.`,
            parse_mode: "HTML",
          }),
          signal: AbortSignal.timeout(5000),
        })

        notified++
      } catch (e) {
        logger.error("UV alert failed for user", { telegramId: user.telegramId, error: e instanceof Error ? e.message : String(e) })
      }
    }

    logger.info("UV alerts sent", { total: users.length, notified })
    return ok({ total: users.length, notified })
  } catch (e) {
    logger.error("UV alerts cron error:", { error: e instanceof Error ? e.message : String(e) })
    return error("Error interno", 500)
  }
}
