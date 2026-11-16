import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { validateCsrf } from "@/lib/csrf-middleware"
import { error } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { getClientIp } from "@/lib/client-ip"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ""

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Email inválido" }, { status: 400 })
    }

    const ip = getClientIp(req)
    const { allowed } = await checkRateLimit(`lead:${ip}`, 3, 3600000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiados intentos. Intenta más tarde." }, { status: 429 })
    }

    const existing = await db.leadMagnet.findUnique({ where: { email } })
    if (!existing) {
      await db.leadMagnet.create({ data: { email } })
    }

    const downloadUrl = `${APP_URL}/guides/skincare-tropical.pdf`

    logger.info("Lead magnet saved", { email })
    return NextResponse.json({ success: true, downloadUrl })
  } catch (e) {
    logger.error("Lead magnet error", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
