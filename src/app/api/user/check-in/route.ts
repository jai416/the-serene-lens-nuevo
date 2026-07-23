import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const body = await req.json().catch(() => ({}))
    const routine = body?.routine === "evening" ? "evening" : "morning"

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Check if already checked in today for this routine
    const existing = await db.dailyCheckIn.findFirst({
      where: {
        userId: session.user.id,
        date: { gte: today },
        routine,
      },
    })

    if (existing) {
      return error("Ya hiciste check-in de esta rutina hoy", 409)
    }

    // Create check-in
    await db.dailyCheckIn.create({
      data: {
        userId: session.user.id,
        routine,
        date: now,
      },
    })

    // Calculate streak
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user) return unauthorized()

    const lastCheckIn = user.lastCheckInDate
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    let newStreak = 1
    if (lastCheckIn) {
      const lastDay = new Date(lastCheckIn.getFullYear(), lastCheckIn.getMonth(), lastCheckIn.getDate())
      const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (24 * 60 * 60 * 1000))

      if (diffDays === 0) {
        // Same day — don't increment streak, just update
        newStreak = user.currentStreak
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak = user.currentStreak + 1
      }
      // else: streak broken, start at 1
    }

    const newMax = Math.max(newStreak, user.maxStreak)

    // Update user streak
    await db.user.update({
      where: { id: session.user.id },
      data: {
        currentStreak: newStreak,
        maxStreak: newMax,
        lastCheckInDate: now,
      },
    })

    // Check for streak reward at 7 days
    let reward = null
    if (newStreak === 7) {
      // Grant a free analysis
      await db.user.update({
        where: { id: session.user.id },
        data: { analysisLimit: { increment: 1 } },
      })
      reward = {
        type: "free_analysis",
        message: "¡Racha de 7 días! Has desbloqueado un análisis extra gratis.",
      }
    }

    logger.info("Check-in completed", {
      userId: session.user.id,
      routine,
      streak: newStreak,
      reward: reward?.type,
    })

    return ok({
      streak: newStreak,
      maxStreak: newMax,
      routine,
      reward,
    })
  } catch (e) {
    logger.error("Check-in error:", e)
    return serverError(e)
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        currentStreak: true,
        maxStreak: true,
        lastCheckInDate: true,
      },
    })

    if (!user) return unauthorized()

    // Get today's check-ins
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayCheckIns = await db.dailyCheckIn.findMany({
      where: {
        userId: session.user.id,
        date: { gte: today },
      },
      select: { routine: true, createdAt: true },
    })

    return ok({
      currentStreak: user.currentStreak,
      maxStreak: user.maxStreak,
      lastCheckIn: user.lastCheckInDate,
      todayCheckIns: todayCheckIns.map((c) => c.routine),
    })
  } catch (e) {
    logger.error("Check-in GET error:", e)
    return serverError(e)
  }
}
