import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { checkRateLimit } from "@/lib/rate-limit"
import { isRedisConfigured } from "@/lib/redis"
import { AnalysisService, AnalysisError } from "@/lib/services/analysis.service"
import { analysisQueue } from "@/lib/queue"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { analysisBodySchema } from "@/lib/validations"
import { getClientIp } from "@/lib/client-ip"
import { isEstheticianPlan } from "@/lib/pricing"

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
      if (!validateCsrf(req)) return error("CSRF token inválido", 403)
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
      // GUEST — 1 análisis gratis sin registro (1 por IP cada 24h)
      if (!validateCsrf(req)) return error("CSRF token inválido", 403)

      // Primero se valida TODO; el intento diario solo se consume con datos válidos
      const guestFormData = await req.formData()
      const guestPhotos = guestFormData.getAll("photos") as File[]
      if (!guestPhotos || guestPhotos.length === 0) return error("Se requieren fotos")

      const guestBody: Record<string, string> = {}
      for (const key of ["age", "gender", "climate", "concerns", "routine", "language"]) {
        const val = guestFormData.get(key)
        if (val) guestBody[key] = val as string
      }
      const guestParsed = analysisBodySchema.safeParse(guestBody)
      if (!guestParsed.success) {
        return error("Datos inválidos: " + guestParsed.error.issues.map((i) => i.message).join(", "))
      }

      const ip = getClientIp(req)
      const guestKey = `analyze:guest:${ip}`
      logger.info("Guest rate limit check", { guestKey, redisConfigured: isRedisConfigured() })
      const rl = await checkRateLimit(guestKey, 1, 24 * 60 * 60 * 1000)
      logger.info("Guest rate limit result", { guestKey, allowed: rl.allowed, remaining: rl.remaining })
      if (!rl.allowed) {
        return error("Ya usaste tu análisis gratis de hoy. Crea una cuenta gratis y ten 3 análisis al mes.", 429)
      }

      try {
        const { result } = await AnalysisService.processGuestAnalysis(guestPhotos, guestBody)
        logger.info("Guest analysis completed", { ip, duration: Date.now() - startTime })
        return ok({ guest: true, result })
      } catch (e) {
        // Se devuelve el intento si la IA falló (no era culpa del usuario)
        const { clearRateLimit } = await import("@/lib/rate-limit")
        await clearRateLimit(guestKey).catch(() => {})
        throw e
      }
    }

    // 2. ESTHETICIAN — bypass total de límites
    const isEsthetician = userRole === "ESTHETICIAN" || isEstheticianPlan(userPlan)

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
    const ip = getClientIp(req)
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
