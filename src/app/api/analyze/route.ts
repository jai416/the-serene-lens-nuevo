import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, error, serverError } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"
import { AnalysisService } from "@/lib/services/analysis.service"
import { logger } from "@/lib/logger"
import { analysisBodySchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("Debes iniciar sesión para realizar un análisis")

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`analyze:${session.user.id}:${ip}`, 5, 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiadas solicitudes. Espera un minuto antes de intentar de nuevo.")
    }

    const formData = await req.formData()
    const photos = formData.getAll("photos") as File[]

    if (!photos || photos.length === 0) return error("Se requieren fotos")

    const body: Record<string, string> = {}
    for (const key of ["concerns", "age", "gender", "climate", "routine", "language"]) {
      const val = formData.get(key)
      if (val) body[key] = val as string
    }

    const parsed = analysisBodySchema.safeParse(body)
    if (!parsed.success) {
      return error("Datos inválidos: " + parsed.error.issues.map((i) => i.message).join(", "))
    }

    const { analysis, result } = await AnalysisService.processAnalysis(session.user.id, photos, body)

    logger.info("Analysis completed", { userId: session.user.id, analysisId: analysis.id })

    return ok({ analysis, result })
  } catch (e) {
    return serverError(e)
  }
}
