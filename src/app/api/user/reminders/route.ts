import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { z } from "zod"
import { logger } from "@/lib/logger"

const reminderSchema = z.object({
  frequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  enabled: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const reminder = await db.userReminder.findUnique({ where: { userId: session.user.id } })
    return ok(reminder || { frequency: "weekly", enabled: false })
  } catch (e) {
    logger.error("Reminder GET error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const body = await req.json().catch(() => ({}))
    const parsed = reminderSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues.map((i) => i.message).join(", "), 400)

    const reminder = await db.userReminder.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      create: { userId: session.user.id, ...parsed.data, frequency: parsed.data.frequency || "weekly", enabled: parsed.data.enabled ?? true },
    })

    return ok(reminder)
  } catch (e) {
    logger.error("Reminder PUT error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
