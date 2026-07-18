import { NextResponse } from "next/server"
import { getAllFeatureFlags } from "@/lib/feature-flags"
import { serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const flags = await getAllFeatureFlags()
    return NextResponse.json({ data: flags })
  } catch (e) {
    logger.error("feature-flags GET error", { error: e instanceof Error ? e.message : String(e) })
    return serverError()
  }
}
