import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { verifyCronSecret } from "@/lib/cron-auth"
import { sendTelegramMessage } from "@/lib/telegram"

export const runtime = "nodejs"

/**
 * Reporte diario de métricas al Telegram de los administradores.
 * Se dispora desde cron-job.org con Bearer CRON_SECRET (ver CRON-SETUP.md).
 */
export async function GET(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const results = await Promise.all([
      db.user.count({ where: { createdAt: { gte: since } } }),
      db.user.count(),
      db.skinAnalysis.count({ where: { createdAt: { gte: since } } }),
      db.skinAnalysis.count(),
      db.transferPayment.count({ where: { status: "pending" } }),
      db.contactMessage.count({ where: { read: false } }),
      db.payment.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "completed", createdAt: { gte: since } }, _sum: { amount: true } }),
      db.analysisJob.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    ]).catch((e) => {
      logger.error("Daily report query failed", { error: e instanceof Error ? e.message : String(e) })
      return null
    })

    if (!results) {
      return NextResponse.json({ error: "Query failed" }, { status: 500 })
    }

    const [
      newUsers,
      totalUsers,
      analyses24h,
      totalAnalyses,
      pendingTransfers,
      unreadMessages,
      revenueAgg,
      revenue24hAgg,
      queuePending,
    ] = results

    const date = new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })

    const lines: string[] = []
    lines.push(`<b>Reporte diario — ${date}</b>`)
    lines.push("")
    lines.push(`<b>Usuarios</b>: +${newUsers} (24h) · ${totalUsers} total`)
    lines.push(`<b>Análisis</b>: +${analyses24h} (24h) · ${totalAnalyses} total`)
    lines.push(
      `<b>Ingresos</b>: $${(revenue24hAgg._sum.amount ?? 0).toFixed(2)} (24h) · $${(revenueAgg._sum.amount ?? 0).toFixed(2)} total`
    )
    lines.push("")

    if (pendingTransfers > 0) {
      lines.push(`<b>Transfermóvil pendientes</b>: ${pendingTransfers} por validar/activar`)
    }
    if (unreadMessages > 0) {
      lines.push(`<b>Mensajes sin leer</b>: ${unreadMessages}`)
    }
    if (queuePending > 0) {
      lines.push(`<b>Cola de análisis</b>: ${queuePending} en proceso`)
    }
    if (pendingTransfers === 0 && unreadMessages === 0 && queuePending === 0) {
      lines.push("Sin pendientes. Todo al día.")
    }

    const message = lines.join("\n")

    const admins = await db.telegramAuth.findMany({ where: { role: "ADMIN" } })
    let sent = 0
    for (const a of admins) {
      try {
        await sendTelegramMessage(a.chatId, message)
        sent++
      } catch (e) {
        logger.error("Daily report send failed", {
          chatId: a.chatId,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    logger.info("Daily report sent", {
      sent,
      newUsers,
      analyses24h,
      revenue24h: revenue24hAgg._sum.amount ?? 0,
    })

    return NextResponse.json({
      sent,
      newUsers,
      analyses24h,
      pendingTransfers,
      unreadMessages,
    })
  } catch (e) {
    logger.error("Daily report cron failed", {
      error: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
