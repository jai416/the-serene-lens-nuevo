import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { analysisQueue } from "@/lib/queue"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number; detail?: string }> = {}
  let overallStatus = "ok"
  const start = Date.now()

  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart }
  } catch {
    checks.database = { status: "error" }
    overallStatus = "degraded"
  }

  try {
    const userCount = await db.user.count()
    checks.users = { status: "ok", latencyMs: userCount }
  } catch {
    checks.users = { status: "error" }
  }

  // Groq key check
  try {
    const groqKey = process.env.GROQ_API_KEY
    checks.groq = {
      status: groqKey ? "ok" : "degraded",
      detail: groqKey ? "1 clave configurada" : "No configurada",
    }
    if (!groqKey) overallStatus = "degraded"
  } catch {
    checks.groq = { status: "error", detail: "No se pudo verificar" }
    overallStatus = "degraded"
  }

  // Cache check
  try {
    const cacheCount = await db.cache.count()
    const expiredCount = await db.cache.count({ where: { expiresAt: { lt: new Date() } } })
    checks.cache = {
      status: "ok",
      detail: `${cacheCount} entradas (${expiredCount} expiradas)`,
    }
  } catch {
    checks.cache = { status: "degraded", detail: "No disponible" }
  }

  // Rate limit check
  try {
    const rateLimitCount = await db.rateLimit.count()
    checks.rateLimit = { status: "ok", detail: `${rateLimitCount} entradas` }
  } catch {
    checks.rateLimit = { status: "degraded", detail: "No disponible" }
  }

  // Feature flags check
  try {
    const flagsCount = await db.appConfig.count({ where: { key: { startsWith: "feature:" } } })
    checks.featureFlags = { status: "ok", detail: `${flagsCount} flags configurados` }
  } catch {
    checks.featureFlags = { status: "degraded", detail: "No disponible" }
  }

  const queueStats = await analysisQueue.getStats()
  checks.queue = {
    status: queueStats.failed > 0 ? "degraded" : "ok",
    latencyMs: queueStats.pending,
    detail: `${queueStats.pending} pendientes, ${queueStats.processing} procesando, ${queueStats.failed} fallidos`,
  }

  const memUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  checks.memory = {
    status: heapUsedMB > 500 ? "degraded" : "ok",
    latencyMs: heapUsedMB,
    detail: `${heapUsedMB}MB / ${heapTotalMB}MB`,
  }

  const response = {
    status: overallStatus,
    version: process.env.npm_package_version || "3.0.0",
    buildTime: "2026-07-04-final",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - start,
    checks,
    queue: queueStats,
    memory: {
      heapUsedMB,
      heapTotalMB,
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
    },
  }

  return NextResponse.json(response, {
    status: overallStatus === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
