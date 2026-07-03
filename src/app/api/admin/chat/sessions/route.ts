import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return unauthorized()
    }

    const allMessages = await db.chatMessage.findMany({
      where: { isAdmin: false },
      orderBy: { createdAt: "desc" },
      select: { sessionId: true, message: true, createdAt: true },
    })

    const grouped = new Map<string, { sessionId: string; lastMessage: string; lastMessageAt: Date }>()
    for (const m of allMessages) {
      if (!grouped.has(m.sessionId)) {
        grouped.set(m.sessionId, {
          sessionId: m.sessionId,
          lastMessage: m.message,
          lastMessageAt: m.createdAt,
        })
      }
    }

    const sessionIds = Array.from(grouped.keys())

    const unreadCounts = await db.chatMessage.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: sessionIds }, isAdmin: false, read: false },
      _count: { id: true },
    })

    const unreadMap = new Map(unreadCounts.map((u) => [u.sessionId, u._count.id]))

    const sessions = Array.from(grouped.values()).map((s) => ({
      sessionId: s.sessionId,
      lastMessage: s.lastMessage,
      lastMessageAt: s.lastMessageAt,
      unreadCount: unreadMap.get(s.sessionId) ?? 0,
    }))

    sessions.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())

    return ok({ sessions })
  } catch (e) {
    return serverError(e)
  }
}
