import { db } from "@/lib/db"

interface FeedbackInput {
  analysisId: string
  rating: number
  comment?: string
  wouldRecommend: boolean
}

export async function submitFeedback(input: FeedbackInput) {
  const { analysisId, rating, comment, wouldRecommend } = input

  const existing = await db.feedback.findUnique({ where: { analysisId } })

  if (existing) {
    return db.feedback.update({
      where: { analysisId },
      data: { rating, comment, wouldRecommend },
    })
  }

  return db.feedback.create({
    data: { analysisId, rating, comment, wouldRecommend },
  })
}

export async function getFeedbackForAnalysis(analysisId: string) {
  return db.feedback.findUnique({ where: { analysisId } })
}

export async function getFeedbackStats() {
  const all = await db.feedback.findMany()

  if (all.length === 0) {
    return { total: 0, avgRating: 0, recommendRate: 0, count: 0 }
  }

  const avgRating = all.reduce((s, f) => s + f.rating, 0) / all.length
  const recommendCount = all.filter((f) => f.wouldRecommend).length

  return {
    total: all.length,
    avgRating: Math.round(avgRating * 10) / 10,
    recommendRate: Math.round((recommendCount / all.length) * 100),
    count: all.length,
  }
}
