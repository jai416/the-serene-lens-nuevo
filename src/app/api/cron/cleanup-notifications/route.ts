import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)
    const deleted = await db.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })

    logger.info("Notification cleanup completed", { deleted: deleted.count, olderThan: cutoff.toISOString() })
    return NextResponse.json({ deleted: deleted.count })
  } catch (e) {
    logger.error("Notification cleanup failed", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
