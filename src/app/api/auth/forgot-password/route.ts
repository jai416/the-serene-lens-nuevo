import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, { status: 429 })
    }

    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user || !user.password) {
      return NextResponse.json({
        success: true,
        message: "Si el email existe, recibirás un enlace de recuperación.",
      })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    const result = await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({
      success: true,
      message: "Si el email existe, recibirás un enlace de recuperación.",
      ...(result && "devUrl" in result ? { resetUrl: result.devUrl } : {}),
    })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
