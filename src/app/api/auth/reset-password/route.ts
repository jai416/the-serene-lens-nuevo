import { NextRequest } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"
import { validateCsrf } from "@/lib/csrf-middleware"

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex")
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      resolve(`${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`reset-password:${ip}`, 10, 60 * 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiadas solicitudes. Intenta más tarde.", 429)
    }

    const { email, token, password } = await req.json()

    if (!email || !token || !password) {
      return error("Faltan datos requeridos", 400)
    }

    if (password.length < 6) {
      return error("La contraseña debe tener al menos 6 caracteres", 400)
    }

    const stored = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    })

    if (!stored) {
      return error("Token inválido o expirado", 400)
    }

    if (new Date() > stored.expires) {
      await db.verificationToken.delete({ where: { token: stored.token } }).catch(() => {})
      return error("El token ha expirado. Solicita uno nuevo.", 400)
    }

    const hashed = await hashPassword(password)
    await db.user.update({
      where: { email },
      data: { password: hashed },
    })

    await db.verificationToken.delete({ where: { token: stored.token } })

    return ok({ message: "Contraseña actualizada correctamente" })
  } catch {
    return serverError()
  }
}
