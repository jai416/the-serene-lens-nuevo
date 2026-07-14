import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail, buildLeadMagnetEmail } from "@/lib/email"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Email inválido" }, { status: 400 })
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const { allowed } = await checkRateLimit(`lead:${ip}`, 3, 3600000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiados intentos. Intenta más tarde." }, { status: 429 })
    }

    const existing = await db.leadMagnet.findUnique({ where: { email } })
    if (!existing) {
      await db.leadMagnet.create({ data: { email } })
    }

    const { subject, html } = buildLeadMagnetEmail()
    await sendEmail({ to: email, subject, html })

    logger.info("Lead magnet sent", { email })
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error("Lead magnet error", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
