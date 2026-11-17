import { NextResponse } from "next/server"
import { cleanupExpiredRateLimits } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { verifyCronSecret } from "@/lib/cron-auth"

export async function POST(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
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
