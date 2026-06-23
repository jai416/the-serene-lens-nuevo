import { db } from "@/lib/db"
import { getSkinEvolution } from "./evolution.service"

export async function recalculateAndSaveEvolution(userId: string): Promise<void> {
  try {
    const evolution = await getSkinEvolution(userId)

    const existing = await db.userEvolution.findUnique({ where: { userId } })
    const data = JSON.stringify(evolution)

    if (existing) {
      await db.userEvolution.update({
        where: { userId },
        data: { data, lastAnalysis: new Date() },
      })
    } else {
      await db.userEvolution.create({
        data: { userId, data, lastAnalysis: new Date() },
      })
    }
  } catch {
    // Evolution update is best-effort — never block the response
  }
}

export async function getCachedEvolution(userId: string) {
  try {
    const row = await db.userEvolution.findUnique({ where: { userId } })
    if (!row) return null
    return { ...JSON.parse(row.data), cachedAt: row.updatedAt }
  } catch {
    return null
  }
}
