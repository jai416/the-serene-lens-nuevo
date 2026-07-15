import { NextRequest } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, serverError } from "@/lib/api-response"
import { sendEmail, buildPasswordResetEmail } from "@/lib/email"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiadas solicitudes. Intenta más tarde.", 429)
    }

    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return error("Email requerido", 400)
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user || !user.password) {
      return ok({
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

    const { subject, html } = buildPasswordResetEmail(resetUrl)
    await sendEmail({ to: email, subject, html })

    return ok({
      message: "Si el email existe, recibirás un enlace de recuperación.",
    })
  } catch {
    return serverError()
  }
}
