import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { z } from "zod"

const schema = z.object({
  analysisId: z.string().min(1),
  helpful: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error("Datos inválidos", 400)

    const analysis = await db.skinAnalysis.findUnique({ where: { id: parsed.data.analysisId } })
    if (!analysis || analysis.userId !== session.user.id) return notFound()

    await db.feedback.upsert({
      where: { analysisId: parsed.data.analysisId },
      update: { rating: parsed.data.helpful ? 5 : 1, wouldRecommend: parsed.data.helpful },
      create: { analysisId: parsed.data.analysisId, rating: parsed.data.helpful ? 5 : 1, wouldRecommend: parsed.data.helpful },
    })

    return ok({ success: true })
  } catch (e) {
    return serverError(e)
  }
}
