import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { type } = await req.json()

    if (!["yes", "no"].includes(type)) {
      return NextResponse.json({ error: "Tipo de feedback inválido" }, { status: 400 })
    }

    const analysis = await db.skinAnalysis.findUnique({ where: { id } })
    if (!analysis || analysis.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    await db.feedback.upsert({
      where: { analysisId: id },
      create: {
        analysisId: id,
        rating: type === "yes" ? 4 : 2,
        wouldRecommend: type === "yes",
        comment: null,
      },
      update: {
        rating: type === "yes" ? 4 : 2,
        wouldRecommend: type === "yes",
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
