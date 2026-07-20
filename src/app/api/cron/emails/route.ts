import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await db.notification.updateMany({
      where: { emailSent: false },
      data: { emailSent: true },
    })

    logger.info("Email migration completed — all notifications marked as web-only")
    return NextResponse.json({ status: "ok", info: "Emails desactivados, notificaciones web activas" })
  } catch (e) {
    logger.error("Email cron failed", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
