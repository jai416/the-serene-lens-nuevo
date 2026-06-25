import { NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { registerSchema } from "@/lib/validations"

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

    const body = await req.json()

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const result = await registerUser(email, password, name)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, userId: result.user?.id })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 })
  }
}
