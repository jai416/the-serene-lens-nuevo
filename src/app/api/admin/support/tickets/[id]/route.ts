import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { z } from "zod"

const adminUpdateTicketSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()
    const { allowed } = await checkRateLimit(`admin:support:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    const { id } = await params
    const ticket = await db.supportTicket.findUnique({ where: { id } })
    if (!ticket) return notFound()
    const body = await req.json()
    const parsed = adminUpdateTicketSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues.map(i => i.message).join(", "), 400)
    const updated = await db.supportTicket.update({ where: { id }, data: parsed.data })
    if (parsed.data.status === "resolved" || parsed.data.status === "closed") {
      await db.notification.create({
        data: { userId: ticket.userId, title: "Ticket actualizado", message: `Tu ticket "${ticket.subject}" ha sido marcado como ${parsed.data.status}.`, link: `/dashboard/support/${id}` },
      })
    }
    return ok({ ticket: updated })
  } catch (e) { return serverError(e) }
}
