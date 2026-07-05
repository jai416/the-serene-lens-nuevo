import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:telegram:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

    const body = await req.json().catch(() => ({}))
    const message = body.message?.trim()
    if (!message) return error("Mensaje requerido")

    const token = process.env.TELEGRAM_TOKEN
    if (!token) return error("TELEGRAM_TOKEN no configurado")

    const users = await db.user.findMany({
      where: { telegramId: { not: null } },
      select: { telegramId: true },
    })

    let sent = 0
    let failed = 0

    const BATCH_SIZE = 30
    const BATCH_DELAY = 1000

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (user) => {
          if (!user.telegramId) return
          try {
            const res = await fetch(
              `https://api.telegram.org/bot${token}/sendMessage`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: user.telegramId,
                  text: message,
                  parse_mode: "HTML",
                }),
                signal: AbortSignal.timeout(5000),
              }
            )
            if (res.ok) sent++
            else failed++
          } catch {
            failed++
          }
        })
      )

      if (i + BATCH_SIZE < users.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY))
      }
    }

    logger.info("Telegram broadcast completed", { total: users.length, sent, failed })
    return ok({ total: users.length, sent, failed })
  } catch (e) {
    logger.error("Telegram broadcast error", { error: e })
    return serverError(e)
  }
}
