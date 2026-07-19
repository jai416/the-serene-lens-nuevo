import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"
import { AnalysisService, AnalysisError } from "@/lib/services/analysis.service"
import { analysisQueue } from "@/lib/queue"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { analysisBodySchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  try {
    // 1. AUTH — session (web) or x-api-key (Telegram)
    const session = await getServerSession(authOptions)
    const apiKey = req.headers.get("x-api-key")

    let userId: string
    let userPlan: string = "FREE"
    let userRole: string = "USER"

    if (session?.user) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, plan: true, role: true },
      })
      if (!user) return unauthorized()
      userId = user.id
      userPlan = user.plan
      userRole = user.role
    } else if (apiKey === process.env.TELEGRAM_BOT_SECRET_TOKEN) {
      const bodyJson = await req.clone().json()
      const telegramId = bodyJson?.telegramId
      if (!telegramId) return error("telegramId requerido para autenticación por API key", 401)

      const user = await db.user.findFirst({
        where: { telegramId: String(telegramId) },
        select: { id: true, plan: true, role: true },
      })
      if (!user) return error("Usuario de Telegram no encontrado", 404)
      userId = user.id
      userPlan = user.plan
      userRole = user.role
    } else {
      return unauthorized()
    }

    // 2. ESTHETICIAN — bypass total de límites
    const isEsthetician = userRole === "ESTHETICIAN" || userPlan === "ESTHETICIAN"

    // 3. LÍMITE DE 3 ANÁLISIS/DÍA (no ESTHETICIAN)
    if (!isEsthetician) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const todayCount = await db.skinAnalysis.count({
        where: {
          userId,
          createdAt: { gte: todayStart },
        },
      })

      if (todayCount >= 3) {
        return error("Has alcanzado tu límite de 3 análisis por hoy.", 429)
      }
    }

    // 4. FRENO GLOBAL DE CONCURRENCIA
    const processingCount = await db.analysisJob.count({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    })
    const CONCURRENT_LIMIT = isEsthetician ? 10 : 2

    if (processingCount >= CONCURRENT_LIMIT) {
      const formData = await req.formData()
      const photos = formData.getAll("photos") as File[]
      const body: Record<string, string> = {}
      for (const key of ["concerns", "age", "gender", "climate", "routine", "language"]) {
        const val = formData.get(key)
        if (val) body[key] = val as string
      }

      const { jobId, position } = await analysisQueue.add(userId, photos, body)

      logger.info("Analysis queued due to concurrency limit", { userId, processingCount, position })

      return NextResponse.json({
        success: true,
        status: "QUEUED",
        message: "El escáner está calibrando sus ópticas debido a alta demanda. Tu análisis ha sido guardado de forma segura y se procesará automáticamente en la cola en un estimado de 2 minutos. No necesitas reintentar.",
        jobId,
        position,
      }, { status: 202 })
    }

    // 5. PROCESAMIENTO NORMAL
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`analyze:${userId}:${ip}`, 5, 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiadas solicitudes. Espera un minuto antes de intentar de nuevo.")
    }

    const formData = await req.formData()
    const photos = formData.getAll("photos") as File[]

    if (!photos || photos.length === 0) return error("Se requieren fotos")

    const body: Record<string, string> = {}
    for (const key of ["concerns", "age", "gender", "climate", "routine", "language", "clientId"]) {
      const val = formData.get(key)
      if (val) body[key] = val as string
    }

    const parsed = analysisBodySchema.safeParse(body)
    if (!parsed.success) {
      return error("Datos inválidos: " + parsed.error.issues.map((i) => i.message).join(", "))
    }

    logger.info("Analysis started", { userId, photoCount: photos.length })

    const { analysis, result } = await AnalysisService.processAnalysis(userId, photos, body)

    const duration = Date.now() - startTime
    logger.info("Analysis completed", { userId, analysisId: analysis.id, duration })

    if (duration > 15000) {
      logger.warn("Slow analysis", { userId, duration, photoCount: photos.length })
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
    return error("Error al analizar las imágenes. Intenta de nuevo.", 500)
  }
}
