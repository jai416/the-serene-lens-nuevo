import { NextRequest } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { getClientIp } from "@/lib/client-ip"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const ip = getClientIp(req)
    const rl = await checkRateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiadas solicitudes. Intenta más tarde.", 429)
    }

    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return error("Email requerido", 400)
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Límite por email además del de IP: sin email el atacante no puede
    // pedir tokens de reset en masa para cuentas ajenas.
    const emailRl = await checkRateLimit(`forgot-password:email:${normalizedEmail}`, 3, 60 * 60 * 1000)
    if (!emailRl.allowed) {
      return ok({
        message: "Si el email existe, recibirás instrucciones.",
      })
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } })

    if (!user || !user.password) {
      return ok({
        message: "Si el email existe, recibirás instrucciones.",
      })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    // Solo el último token emitido sirve: los anteriores quedan invalidados
    await db.verificationToken.deleteMany({ where: { identifier: normalizedEmail } })

    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`

    // Aviso al propietario: el email está desactivado, así que el enlace
    // se muestra en pantalla. Queda traza por si alguien abusa de ello.
    logger.warn("Password reset issued", { email: normalizedEmail, ip })

    return ok({
      message: "Enlace de recuperación generado.",
      resetUrl,
      info: "El servicio de email estará disponible próximamente. Guarda este enlace para restablecer tu contraseña.",
    })
  } catch {
    return serverError()
  }
}
