import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { z } from "zod"

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").trim()

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200).transform(stripHtml),
  message: z.string().min(1).max(5000).transform(stripHtml),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = 20
    const skip = (page - 1) * limit
    const [tickets, total] = await db.$transaction([
      db.supportTicket.findMany({
        where: { userId: session.user.id },
        include: { _count: { select: { responses: true } } },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
      }),
      db.supportTicket.count({ where: { userId: session.user.id } }),
    ])
    return ok({ tickets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (e) { return serverError(e) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const body = await req.json()
    const parsed = createTicketSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues.map(i => i.message).join(", "), 400)
    const ticket = await db.supportTicket.create({ data: { userId: session.user.id, ...parsed.data } })
    try {
      await db.contactMessage.create({
        data: {
          userId: session.user.id,
          name: session.user.name || "Usuario",
          email: session.user.email || "",
          subject: `[Ticket] ${parsed.data.subject}`,
          message: parsed.data.message,
        },
      })
    } catch {}
    try {
      const { notifyAdmins } = await import("@/lib/telegram")
      await notifyAdmins("new_ticket", `🎫 Nuevo ticket: ${parsed.data.subject}`)
    } catch {}
    return ok({ ticket }, 201)
  } catch (e) { return serverError(e) }
}
