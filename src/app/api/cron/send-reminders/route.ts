import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { createReminderNotification } from "@/lib/notifications"

const CRON_SECRET = process.env.CRON_SECRET || ""

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!CRON_SECRET || auth !== CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const reminders = await db.userReminder.findMany({
      where: { enabled: true },
      include: { user: { select: { id: true, name: true } } },
    })

    const now = new Date()
    const toSend = reminders.filter(r => {
      const daysSinceLast = r.lastSentAt
        ? Math.floor((now.getTime() - r.lastSentAt.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity
      if (r.frequency === "weekly" && daysSinceLast >= 7) return true
      if (r.frequency === "biweekly" && daysSinceLast >= 14) return true
      if (r.frequency === "monthly" && daysSinceLast >= 30) return true
      return false
    })

    if (toSend.length > 0) {
      await db.notification.createMany({
        data: toSend.map(r => ({
          userId: r.user.id,
          title: "Recordatorio de rutina",
          message: "¡Es hora de tu rutina de cuidado facial!",
          link: "/dashboard",
        })),
      })
      await db.userReminder.updateMany({
        where: { id: { in: toSend.map(r => r.id) } },
        data: { lastSentAt: now },
      })
    }

    const sent = toSend.length
    const skipped = reminders.length - sent

    logger.info("Reminders sent", { sent, skipped })
    return NextResponse.json({ sent, skipped })
  } catch (e) {
    logger.error("Send reminders error", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
