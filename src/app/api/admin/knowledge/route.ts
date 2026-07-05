import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const knowledge = await db.botKnowledge.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    })

    return ok({ knowledge })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const body = await req.json().catch(() => ({}))
    const { allowed } = await checkRateLimit(`admin:knowledge:${session.user.id}`, 30, 60000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    }
    if (!body.title || !body.content) return error("Título y contenido requeridos")

    const entry = await db.botKnowledge.create({
      data: {
        title: body.title,
        content: body.content,
        category: body.category || "general",
        subcategory: body.subcategory || null,
        source: body.source || "admin",
        sourceUrl: body.sourceUrl || null,
        priority: body.priority || 0,
        keywords: body.keywords || [],
        synonyms: body.synonyms || [],
        enabled: body.enabled !== false,
        updatedBy: session.user.id,
      },
    })

    return ok({ entry })
  } catch (e) {
    return serverError(e)
  }
}
