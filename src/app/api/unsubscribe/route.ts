import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ok, error, serverError } from "@/lib/api-response"

const unsubscribeSchema = z.object({
  email: z.string().email(),
  reason: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = unsubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return error("Email inválido", 400)
    }

    const { email, reason } = parsed.data

    await db.unsubscribe.upsert({
      where: { email },
      create: { email, reason },
      update: { reason },
    })

    logger.info("User unsubscribed", { email })

    return ok({ unsubscribed: true })
  } catch (err) {
    logger.error("Unsubscribe error", { error: err instanceof Error ? err.message : "Unknown" })
    return serverError()
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return error("Email requerido", 400)
  }

  const record = await db.unsubscribe.findUnique({ where: { email } })
  return ok({ unsubscribed: !!record })
}
