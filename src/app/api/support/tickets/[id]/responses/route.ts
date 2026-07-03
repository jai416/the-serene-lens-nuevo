import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { z } from "zod"

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").trim()

const addResponseSchema = z.object({
  message: z.string().min(1).max(5000).transform(stripHtml),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const { id } = await params
    const ticket = await db.supportTicket.findUnique({ where: { id }, select: { id: true, userId: true } })
    if (!ticket || ticket.userId !== session.user.id) return notFound()
    const responses = await db.supportTicketResponse.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, role: true } } },
    })
    return ok({ responses })
  } catch (e) { return serverError(e) }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const { id } = await params
    const ticket = await db.supportTicket.findUnique({ where: { id }, select: { id: true, userId: true } })
    if (!ticket || ticket.userId !== session.user.id) return notFound()
    const body = await req.json()
    const parsed = addResponseSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.issues.map(i => i.message).join(", "), 400)
    const response = await db.supportTicketResponse.create({
      data: { ticketId: id, userId: session.user.id, message: parsed.data.message, isAdmin: false },
      include: { user: { select: { id: true, name: true, role: true } } },
    })
    return ok({ response }, 201)
  } catch (e) { return serverError(e) }
}
