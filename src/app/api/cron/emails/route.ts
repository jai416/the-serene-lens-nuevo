import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const pendingNotifications = await db.notification.findMany({
      where: { sentAt: null, emailSent: false },
      include: { user: { select: { email: true, name: true } } },
      take: 20,
    })

    let sent = 0
    for (const notif of pendingNotifications) {
      if (!notif.user.email) continue
      try {
        const { sendEmail } = await import("@/lib/email")
        const ok = await sendEmail({
          to: notif.user.email,
          subject: `The Serene Lens — ${notif.title.replace(/[🎉✅❌⚠️🆕📢🔔⭐]/g, "").trim()}`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#1A1A1A">${notif.title}</h2><p style="color:#666;line-height:1.6">${notif.message}</p>${notif.link ? `<a href="${notif.link}" style="display:inline-block;padding:12px 24px;background:#88B078;color:#1A1A1A;text-decoration:none;border-radius:12px;font-weight:600;margin-top:16px">Ver en la web</a>` : ""}</div>`,
        })
        if (ok) {
          await db.notification.update({
            where: { id: notif.id },
            data: { emailSent: true },
          })
          sent++
        }
      } catch {
        continue
      }
    }

    logger.info("Email cron completed", { pending: pendingNotifications.length, sent })
    return NextResponse.json({ pending: pendingNotifications.length, sent })
  } catch (e) {
    logger.error("Email cron failed", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
