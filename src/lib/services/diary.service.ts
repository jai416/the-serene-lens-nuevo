import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export class DiaryError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = "DiaryError"
  }
}

export const DiaryService = {
  async getEntries(userId: string, days = 30) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    cutoff.setHours(0, 0, 0, 0)

    return db.skinDiary.findMany({
      where: { userId, date: { gte: cutoff } },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        feeling: true,
        notes: true,
        createdAt: true,
      },
    })
  },

  async upsertEntry(userId: string, dateStr: string, feeling: number, notes?: string) {
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) {
      throw new DiaryError("No puedes registrar entradas en el futuro", "FUTURE_DATE")
    }

    const entry = await db.skinDiary.upsert({
      where: { userId_date: { userId, date } },
      update: { feeling, notes },
      create: { userId, date, feeling, notes },
      select: {
        id: true,
        date: true,
        feeling: true,
        notes: true,
        createdAt: true,
      },
    })

    logger.info("Diary entry upserted", { userId, date: dateStr, feeling })
    return entry
  },

  async deleteEntry(userId: string, entryId: string) {
    const entry = await db.skinDiary.findUnique({ where: { id: entryId } })
    if (!entry) throw new DiaryError("Entrada no encontrada", "NOT_FOUND")
    if (entry.userId !== userId) throw new DiaryError("No autorizado", "UNAUTHORIZED")

    await db.skinDiary.delete({ where: { id: entryId } })
    logger.info("Diary entry deleted", { userId, entryId })
  },

  async getWeeklyTrend(userId: string) {
    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)

    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const [thisWeek, lastWeek] = await Promise.all([
      db.skinDiary.findMany({
        where: { userId, date: { gte: thisWeekStart } },
        select: { feeling: true },
      }),
      db.skinDiary.findMany({
        where: { userId, date: { gte: lastWeekStart, lt: thisWeekStart } },
        select: { feeling: true },
      }),
    ])

    if (thisWeek.length === 0) return null

    const thisAvg = thisWeek.reduce((s, e) => s + e.feeling, 0) / thisWeek.length

    if (lastWeek.length === 0) {
      return { trend: "stable" as const, avg: thisAvg, thisWeekCount: thisWeek.length, lastWeekCount: 0 }
    }

    const lastAvg = lastWeek.reduce((s, e) => s + e.feeling, 0) / lastWeek.length
    const diff = thisAvg - lastAvg

    return {
      trend: (diff > 0.3 ? "up" : diff < -0.3 ? "down" : "stable") as "up" | "down" | "stable",
      avg: thisAvg,
      thisWeekCount: thisWeek.length,
      lastWeekCount: lastWeek.length,
    }
  },
}
