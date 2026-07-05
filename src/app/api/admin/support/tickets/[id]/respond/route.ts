import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { z } from "zod"

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").trim()

const adminRespondSchema = z.object({
  message: z.string().min(1).max(5000).transform(stripHtml),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()
    const { allowed } = await checkRateLimit(`admin:support:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    const { id } = await params
    const ticket = await db.supportTicket.findUnique({ where: { id } })
    if (!ticket) return notFound()
    const body = await req.json()
    const parsed = adminRespondSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues.map(i => i.message).join(", "), 400)
    const [response] = await db.$transaction([
      db.supportTicketResponse.create({
        data: { ticketId: id, userId: session.user.id, message: parsed.data.message, isAdmin: true },
        include: { user: { select: { id: true, name: true, role: true } } },
      }),
      db.supportTicket.update({ where: { id }, data: { status: "in_progress" } }),
      db.notification.create({
        data: { userId: ticket.userId, title: "Respuesta de soporte", message: `Has recibido una respuesta en tu ticket: ${ticket.subject}`, link: `/dashboard/support/${id}` },
      }),
    ])
    return ok({ response }, 201)
  } catch (e) { return serverError(e) }
}
