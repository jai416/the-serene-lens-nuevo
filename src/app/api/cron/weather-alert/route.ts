import { NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("[WEATHER-ALERT] Weather UV alert cron ran - feature pending integration")

    return NextResponse.json({
      success: true,
      message: "Weather UV alert cron ran - feature pending integration",
    })
  } catch (e) {
    console.error("[WEATHER-ALERT] Cron failed:", e)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
