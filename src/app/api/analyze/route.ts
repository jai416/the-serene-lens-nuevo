import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"
import { AnalysisService, AnalysisError } from "@/lib/services/analysis.service"
import { logger } from "@/lib/logger"
import { analysisBodySchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

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

    logger.info("Analysis started", { userId: session.user.id, photoCount: photos.length })

    const { analysis, result } = await AnalysisService.processAnalysis(session.user.id, photos, body)

    const duration = Date.now() - startTime
    logger.info("Analysis completed", { userId: session.user.id, analysisId: analysis.id, duration })

    if (duration > 15000) {
      logger.warn("Slow analysis", { userId: session.user.id, duration, photoCount: photos.length })
    }

    return ok({ analysis, result })
  } catch (e) {
    const duration = Date.now() - startTime
    if (e instanceof AnalysisError) {
      const statusMap: Record<string, number> = {
        VALIDATION: 400,
        USAGE_LIMIT: 403,
        COMPRESSION: 400,
        AI_ERROR: 502,
        DB_ERROR: 500,
        UNKNOWN: 500,
      }
      const status = statusMap[e.code] || 500
      logger.error("Analysis failed", { duration, code: e.code, message: e.message })
      return error(e.message, status)
    }
    logger.error("Analysis failed", { duration, error: e })
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("ETIMEDOUT") || msg.includes("fetch failed") || msg.includes("timeout")) {
      return error("El servicio de análisis IA está temporalmente no disponible. Intenta de nuevo en unos minutos.", 503)
    }
    return NextResponse.json(
      { success: false, error: "Error al analizar las imágenes. Intenta de nuevo." },
      { status: 500 }
    )
  }
}
