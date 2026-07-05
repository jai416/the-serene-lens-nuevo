import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const deleted = await db.cache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    logger.info("Cache cleanup completed", { deleted: deleted.count })
    return NextResponse.json({ deleted: deleted.count })
  } catch (e) {
    logger.error("Cache cleanup failed", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
