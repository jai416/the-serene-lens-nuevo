import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { analysisQueue } from "@/lib/queue"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number }> = {}
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

  const queueStats = analysisQueue.getStats()
  checks.queue = {
    status: queueStats.failed > 0 ? "degraded" : "ok",
    latencyMs: queueStats.pending,
  }

  const memUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  checks.memory = {
    status: heapUsedMB > 500 ? "degraded" : "ok",
    latencyMs: heapUsedMB,
  }

  const response = {
    status: overallStatus,
    version: process.env.npm_package_version || "3.0.0",
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
