import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return unauthorized()
    }

    const { allowed } = await checkRateLimit(`admin:chat:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

    const { sessionId } = await params
    const body = await req.json()
    const { message } = body

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return error("message es requerido", 400)
    }

    const created = await db.chatMessage.create({
      data: {
        sessionId,
        message: message.trim(),
        userId: session.user.id,
        isAdmin: true,
        read: true,
      },
    })

    await db.chatMessage.updateMany({
      where: { sessionId, isAdmin: false, read: false },
      data: { read: true },
    })

    return ok({ message: created })
  } catch (e) {
    return serverError(e)
  }
}
