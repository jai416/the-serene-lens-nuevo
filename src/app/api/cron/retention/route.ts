import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const inactive = await db.user.findMany({
      where: {
        plan: "FREE",
        updatedAt: { lt: thirtyDaysAgo },
      },
      select: { id: true, email: true, name: true, updatedAt: true },
      take: 50,
    })

    let sent = 0
    for (const u of inactive) {
      if (!u.email) continue
      try {
        const { sendEmail, buildRetentionEmail } = await import("@/lib/email")
        const { subject, html } = buildRetentionEmail(u.name || "Usuario")
        const ok = await sendEmail({ to: u.email, subject, html })
        if (ok) sent++
      } catch {
        continue
      }
    }

    logger.info("Retention cron completed", { checked: inactive.length, sent })
    return NextResponse.json({ checked: inactive.length, sent })
  } catch (e) {
    logger.error("Retention cron failed", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
