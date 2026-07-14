import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail, buildReminderEmail } from "@/lib/email"
import { logger } from "@/lib/logger"

const CRON_SECRET = process.env.CRON_SECRET || ""

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!CRON_SECRET || auth !== CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const reminders = await db.userReminder.findMany({
      where: { enabled: true },
      include: { user: { select: { id: true, email: true, name: true } } },
    })

    let sent = 0
    let skipped = 0

    for (const r of reminders) {
      if (!r.user.email) { skipped++; continue }

      const lastSent = r.lastSentAt
      const now = new Date()
      let shouldSend = false

      const daysSinceLast = lastSent
        ? Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity

      if (r.frequency === "weekly" && daysSinceLast >= 7) shouldSend = true
      else if (r.frequency === "biweekly" && daysSinceLast >= 14) shouldSend = true
      else if (r.frequency === "monthly" && daysSinceLast >= 30) shouldSend = true

      if (!shouldSend) { skipped++; continue }

      const { subject, html } = buildReminderEmail(r.user.name || "")
      const ok = await sendEmail({ to: r.user.email, subject, html })

      if (ok) {
        await db.userReminder.update({ where: { id: r.id }, data: { lastSentAt: now } })
        sent++
      } else {
        skipped++
      }
    }

    logger.info("Reminders sent", { sent, skipped })
    return NextResponse.json({ sent, skipped })
  } catch (e) {
    logger.error("Send reminders error", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
