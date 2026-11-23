import { NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { getClientIp } from "@/lib/client-ip"
import { logger } from "@/lib/logger"

/**
 * M3.5.19 — Flujo PÚBLICO de recuperación de contraseña CERRADO.
 *
 * Contexto: el canal de email está deshabilitado (`sendEmail` es un stub que
 * nunca entrega nada). Antes, este endpoint CREABA un token y lo devolvía
 * como `resetUrl` en la respuesta HTTP SIN autenticación → cualquier cliente
 * que conociera el email de una cuenta podía obtener su enlace de reset
 * (toma de control de cuentas; rate-limits de3/h no lo impedían).
 *
 * Mientras no exista un canal de entrega seguro:
 *  - NO se crean tokens (un token no entregable es inutilizable y, hoy, la
 *    única "entrega" era exponerlo públicamente).
 *  - Respuesta IDÉNTICA exista o no la cuenta: sin enumeración de cuentas y
 *    sin prometer un email que no se envía.
 *  - Rate limits por IP y por email intactos (defensa en profundidad).
 *  - `/api/auth/reset-password` sigue operativo (expiración1h + uso único)
 *    para tokens emitidos por un canal seguro (futuro o manual documentado).
 *  - Recuperación actual: procedimiento manual del administrador (ver
 *    informe M3.5.19) hasta que exista entrega real de email.
 */

const DISABLED_MESSAGE =
  "La recuperación de contraseñas en línea está deshabilitada temporalmente. Si necesitas recuperar tu cuenta, contacta con el soporte."

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

    // Rate limit por email: actúa sobre cualquier entrada, exista o no la
    // cuenta (las ramas de respuesta son idénticas → sin enumeración).
    const emailRl = await checkRateLimit(
      `forgot-password:email:${email.trim().toLowerCase()}`,
      3,
      60 * 60 * 1000
    )
    if (!emailRl.allowed) {
      return error("Demasiadas solicitudes. Intenta más tarde.", 429)
    }

    // Trazas de abuso sin secretos: aquí NO se genera ningún token.
    logger.warn("Password recovery requested (canal deshabilitado)", { ip })

    return ok({ message: DISABLED_MESSAGE })
  } catch {
    return serverError()
  }
}
