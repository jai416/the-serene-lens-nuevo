import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface KnowledgeResult {
  id: string
  title: string
  content: string
  category: string
  subcategory: string | null
  source: string
  sourceUrl: string | null
  priority: number
  score: number
}

export async function searchKnowledge(query: string, limit = 3): Promise<KnowledgeResult[]> {
  try {
    const terms = query.toLowerCase().split(" ").filter((t) => t.length > 2)

    const allEntries = await db.botKnowledge.findMany({
      where: { enabled: true, validUntil: null },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    })

    const scored: KnowledgeResult[] = allEntries.map((entry) => {
      let score = entry.priority

      const titleLower = entry.title.toLowerCase()
      const contentLower = entry.content.toLowerCase()
      const keywordsLower = entry.keywords?.map((k) => k.toLowerCase()) || []
      const synonymsLower = entry.synonyms?.map((s) => s.toLowerCase()) || []

      for (const term of terms) {
        if (titleLower.includes(term)) score += 10
        if (keywordsLower.some((k) => k.includes(term) || term.includes(k))) score += 8
        if (synonymsLower.some((s) => s.includes(term) || term.includes(s))) score += 6
        if (contentLower.includes(term)) score += 4
      }

      // Exact phrase match bonus
      if (contentLower.includes(query.toLowerCase())) score += 5
      if (titleLower.includes(query.toLowerCase())) score += 3

      return {
        id: entry.id,
        title: entry.title,
        content: entry.content.slice(0, 500),
        category: entry.category,
        subcategory: entry.subcategory,
        source: entry.source,
        sourceUrl: entry.sourceUrl,
        priority: entry.priority,
        score,
      }
    })

    // Update lastUsedAt
    Promise.allSettled(
      scored.slice(0, limit).map((r) =>
        db.botKnowledge.update({ where: { id: r.id }, data: { lastUsedAt: new Date() } })
      )
    ).catch(() => {})

    return scored.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch (e) {
    logger.error("Knowledge search error", { error: e })
    return []
  }
}

export async function recordFeedback(knowledgeId: string, helpful: boolean): Promise<void> {
  try {
    if (helpful) {
      await db.botKnowledge.update({ where: { id: knowledgeId }, data: { helpfulCount: { increment: 1 } } })
    } else {
      await db.botKnowledge.update({ where: { id: knowledgeId }, data: { unhelpfulCount: { increment: 1 } } })
    }
  } catch {
    // ignore
  }
}
