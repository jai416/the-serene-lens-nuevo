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

    const uvTemplate = (uv: number) => {
      const msgs = [
        `☀️ ¡Alto UV hoy! El índice UV en tu zona alcanzó ${uv}, considerado extremo. Protégete con protector solar de amplio espectro y reaplica cada 2 horas. Recuerda que la protección solar es el paso más importante de tu rutina. — The Serene Lens`,
        `🌤 Cuida tu piel hoy. El índice UV en tu área es de ${uv} (extremo). Usa sombrero, gafas de sol y protector solar FPS 50+. Tu piel te lo agradecerá. — The Serene Lens`,
        `⚠️ Radiación UV muy alta: ${uv}. Evita la exposición solar entre 10am y 4pm. Si sales al exterior, aplica protector solar 30 minutos antes y reaplica cada 2 horas. — The Serene Lens`,
        `☀️ ¡Atención! Hoy el índice UV alcanza ${uv} en tu zona. El sol caribeño es hermoso pero exigente. No olvides tu protector solar, incluso en días nublados. — The Serene Lens`,
      ]
      return msgs[new Date().getDate() % msgs.length]
    }

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
            text: uvTemplate(uvMax),
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
