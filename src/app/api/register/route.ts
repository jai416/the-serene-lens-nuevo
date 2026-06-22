import { NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"
import { buildEmailSequence, sendEmail } from "@/lib/services/email-sequence"
import { checkRateLimit } from "@/lib/rate-limit"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`register:${ip}`, 10, 24 * 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiados registros desde esta dirección. Intenta de nuevo más tarde." },
        { status: 429 }
      )
    }

    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    const result = await registerUser(email, password, name)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    if (result.user) {
      try {
        const sequence = buildEmailSequence(result.user.name || "usuario", appUrl)
        const welcomeEmail = sequence.find((e) => e.day === 0)
        if (welcomeEmail) {
          await sendEmail({
            to: result.user.email,
            subject: welcomeEmail.subject,
            html: welcomeEmail.html,
          })
        }
      } catch {}
    }

    return NextResponse.json({ ok: true, userId: result.user?.id })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 })
  }
}
