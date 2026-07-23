import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return unauthorized()
    }

    const { id } = await params
    const { type } = await req.json()

    if (!["yes", "no"].includes(type)) {
      return error("Tipo de feedback inválido", 400)
    }

    const analysis = await db.skinAnalysis.findUnique({ where: { id } })
    if (!analysis || analysis.userId !== session.user.id) {
      return forbidden()
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

    return ok({ saved: true })
  } catch (e) {
    return serverError(e)
  }
}
