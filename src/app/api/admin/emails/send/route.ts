import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendEmail, buildEmailHtml } from "@/lib/email"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"

const SEGMENT_FILTERS: Record<string, any> = {
  all: {},
  free: { plan: "FREE" },
  premium: { plan: "PREMIUM" },
  pro: { plan: "PRO" },
  proPlus: { plan: "PRO_PLUS" },
  new: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") return unauthorized()

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`admin-emails-send:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiados envíos. Intenta más tarde.", 429)
    }

    let body: { segment?: string; subject?: string; message?: string; userIds?: string[] }
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido", 400)
    }

    const { segment, subject, message, userIds } = body
    if (!subject || !message) {
      return error("Faltan campos requeridos: subject, message", 400)
    }

    let users: { email: string }[]
    if (userIds && Array.isArray(userIds)) {
      users = await db.user.findMany({
        where: { id: { in: userIds }, email: { not: null } },
        select: { email: true },
      })
    } else if (segment && SEGMENT_FILTERS[segment]) {
      users = await db.user.findMany({
        where: SEGMENT_FILTERS[segment],
        select: { email: true },
      })
    } else {
      return error("Segmento inválido o lista de usuarios requerida", 400)
    }

    const html = buildEmailHtml(subject, message)
    let sent = 0
    let failed = 0

    for (const user of users) {
      if (!user.email) continue
      try {
        const ok = await sendEmail({ to: user.email, subject, html })
        if (ok) sent++
        else failed++
      } catch {
        failed++
      }
    }

    return ok({ sent, failed, total: users.length })
  } catch (e) {
    console.error("Admin email send error:", e)
    return serverError(e)
  }
}
