import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { count } = await db.user.updateMany({
      where: {
        plan: "PREMIUM",
        trialEndsAt: { lt: new Date() },
        NOT: { role: "ADMIN" },
      },
      data: {
        plan: "FREE",
        analysisLimit: 1,
        analysisUsed: 0,
        trialEndsAt: null,
      },
    })

    if (count > 0) {
      const expired = await db.user.findMany({
        where: { plan: "FREE", trialEndsAt: null, updatedAt: { gte: new Date(Date.now() - 60000) } },
        select: { email: true, name: true },
      })
      for (const u of expired) {
        if (u.email) {
          try {
            const { sendEmail, buildTrialEndedEmail } = await import("@/lib/email")
            const { subject, html } = buildTrialEndedEmail(u.name || "Usuario")
            sendEmail({ to: u.email, subject, html }).catch(() => {})
          } catch {}
        }
      }
    }

    logger.info("Trial cleanup completed", { degraded: count })
    return NextResponse.json({ degraded: count })
  } catch (e) {
    logger.error("Trial cleanup failed", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
