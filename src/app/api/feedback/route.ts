import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"

const bodySchema = z.object({
  analysisId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  wouldRecommend: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return unauthorized("Debes iniciar sesión")
    }

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return error("Datos inválidos", 400)
    }

    const { analysisId, rating, comment, wouldRecommend } = parsed.data

    const analysis = await db.skinAnalysis.findUnique({ where: { id: analysisId } })
    if (!analysis || analysis.userId !== session.user.id) {
      return notFound("Análisis no encontrado")
    }

    const feedback = await db.feedback.upsert({
      where: { analysisId },
      update: { rating, comment, wouldRecommend },
      create: { analysisId, rating, comment, wouldRecommend },
    })

    return ok({ feedback })
  } catch {
    return serverError()
  }
}
