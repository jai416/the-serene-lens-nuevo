import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

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
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Debes iniciar sesión" } }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.issues } }, { status: 400 })
    }

    const { analysisId, rating, comment, wouldRecommend } = parsed.data

    const analysis = await db.skinAnalysis.findUnique({ where: { id: analysisId } })
    if (!analysis || analysis.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Análisis no encontrado" } }, { status: 404 })
    }

    const feedback = await db.feedback.upsert({
      where: { analysisId },
      update: { rating, comment, wouldRecommend },
      create: { analysisId, rating, comment, wouldRecommend },
    })

    return NextResponse.json({ success: true, data: feedback })
  } catch {
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } }, { status: 500 })
  }
}
