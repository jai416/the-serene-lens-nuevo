import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "No existe una cuenta con este email" }, { status: 404 })
    }

    if (!user.password) {
      return NextResponse.json({ error: "Esta cuenta usa inicio de sesión con Google o GitHub. No puedes recuperar la contraseña." }, { status: 400 })
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
