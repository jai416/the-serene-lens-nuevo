import { NextResponse } from "next/server"
import { cleanupExpiredRateLimits } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const deleted = await cleanupExpiredRateLimits()
    logger.info("Rate limit cleanup completed", { deleted })
    return NextResponse.json({ deleted })
  } catch (e) {
    logger.error("Rate limit cleanup failed", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
