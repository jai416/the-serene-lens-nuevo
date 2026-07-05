import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest } from "next/server"
import { ok, error, serverError } from "@/lib/api-response"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId")
    if (!sessionId || !UUID_RE.test(sessionId)) {
      return error("sessionId inválido", 400)
    }

    const messages = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 50,
    })

    return ok({ messages })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { sessionId, message, userId } = body

    if (!sessionId || !UUID_RE.test(sessionId)) {
      return error("sessionId inválido", 400)
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return error("message es requerido", 400)
    }

    const resolvedUserId = userId && session?.user?.id === userId ? userId : null

    const created = await db.chatMessage.create({
      data: {
        sessionId,
        message: message.trim(),
        userId: resolvedUserId,
        isAdmin: false,
        read: false,
      },
    })

    const adminMessages = await db.chatMessage.findMany({
      where: { sessionId, isAdmin: true },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { createdAt: true },
    })

    const shouldNotify =
      adminMessages.length === 0 ||
      Date.now() - adminMessages[0].createdAt.getTime() > 300_000

    if (shouldNotify) {
      try {
        const { notifyAdmins } = await import("@/lib/telegram")
        await notifyAdmins("new_chat", message.trim())
      } catch {
        // notifyAdmins may fail silently
      }
    }

    return ok({ message: created })
  } catch (e) {
    return serverError(e)
  }
}
