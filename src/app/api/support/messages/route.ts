import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { z } from "zod"

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").trim()

const createMessageSchema = z.object({
  subject: z.string().min(1).max(200).transform(stripHtml),
  message: z.string().min(1).max(5000).transform(stripHtml),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const messages = await db.contactMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return ok({ messages })
  } catch (e) { return serverError(e) }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = createMessageSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues.map(i => i.message).join(", "), 400)

    const message = await db.contactMessage.create({
      data: {
        userId: session.user.id,
        name: session.user.name || "Usuario",
        email: session.user.email || "",
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    })

    try {
      const { notifyAdmins } = await import("@/lib/telegram")
      await notifyAdmins("new_support_message", `💬 Nuevo mensaje de soporte: ${parsed.data.subject}`)
    } catch {}

    return ok({ message }, 201)
  } catch (e) { return serverError(e) }
}
