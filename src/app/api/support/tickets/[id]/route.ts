import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { z } from "zod"

const updateTicketSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const { id } = await params
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: { responses: { orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, name: true, role: true } } } } },
    })
    if (!ticket || ticket.userId !== session.user.id) return notFound()
    return ok({ ticket })
  } catch (e) { return serverError(e) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const { id } = await params
    const ticket = await db.supportTicket.findUnique({ where: { id } })
    if (!ticket || ticket.userId !== session.user.id) return notFound()
    const body = await req.json()
    const parsed = updateTicketSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues.map(i => i.message).join(", "), 400)
    const updated = await db.supportTicket.update({ where: { id }, data: parsed.data })
    return ok({ ticket: updated })
  } catch (e) { return serverError(e) }
}
