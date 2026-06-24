import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const unsubscribeSchema = z.object({
  email: z.string().email(),
  reason: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = unsubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    const { email, reason } = parsed.data

    // Upsert unsubscribe record
    await db.unsubscribe.upsert({
      where: { email },
      create: { email, reason },
      update: { reason },
    })

    logger.info("User unsubscribed", { email })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Unsubscribe error", { error: error instanceof Error ? error.message : "Unknown" })
    return NextResponse.json(
      { error: "Error al procesar" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  const record = await db.unsubscribe.findUnique({ where: { email } })
  return NextResponse.json({ unsubscribed: !!record })
}
