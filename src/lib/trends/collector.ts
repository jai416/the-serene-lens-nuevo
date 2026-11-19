import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { fetchJson, fetchText, slugify, SourceFetchError } from "@/lib/trends/sources"

/**
 * Recolector de tendencias (M1 del AI Growth Engine).
 *
 * Descubre candidatos de DOS orígenes claramente distinguibles:
 *  - EXTERNOS: temas con actividad reciente en PubMed (evidencia científica)
 *  - INTERNOS: preguntas reales de usuarios (mensajes de contacto y posts
 *    de la comunidad) → se guarda en `origin` e `internalMentions` para
 *    NUNCA confundir interés propio con tendencia de mercado
 *
 * Cada tendencia se enriquece con fuentes verificadas (Wikipedia, COSING)
 * y solo se guarda si tiene ≥2 fuentes distintas. Sin inventar momentum:
 * en M1 no se puntúa; el scoring llega en M2.
 */

/** Alcance temático del producto (audiencia: piel latina, clima caribeño). */
const TOPICS: Array<{ slug: string; title: string; category: string; query: string; inci?: string }> = [
  { slug: "niacinamide", title: "Niacinamida", category: "ingredient", query: "niacinamide skin", inci: "NIACINAMIDE" },
  { slug: "retinol", title: "Retinol", category: "ingredient", query: "retinol skin aging", inci: "RETINOL" },
  { slug: "acido-hialuronico", title: "Ácido hialurónico", category: "ingredient", query: "hyaluronic acid skin", inci: "HYALURONIC ACID" },
  { slug: "protector-solar", title: "Protector solar", category: "ingredient", query: "sunscreen photoprotection", inci: "" },
  { slug: "barrera-cutanea", title: "Barrera cutánea", category: "concern", query: "skin barrier function", inci: "" },
  { slug: "hiperpigmentacion", title: "Hiperpigmentación", category: "concern", query: "skin hyperpigmentation", inci: "" },
  { slug: "acne", title: "Acné", category: "concern", query: "acne treatment skin", inci: "" },
  { slug: "piel-sensible", title: "Piel sensible", category: "concern", query: "sensitive skin irritation", inci: "" },
  { slug: "vitamina-c", title: "Vitamina C tópica", category: "ingredient", query: "topical vitamin C skin", inci: "ASCORBIC ACID" },
  { slug: "ceramidas", title: "Ceramidas", category: "ingredient", query: "ceramides skin barrier", inci: "CERAMIDE NP" },
  { slug: "exfoliacion", title: "Exfoliación química", category: "ingredient", query: "chemical exfoliation skin", inci: "" },
  { slug: "envejecimiento-cutaneo", title: "Envejecimiento cutáneo", category: "research", query: "skin aging prevention", inci: "" },
]

interface PubmedPaper {
  pmid: string
  title: string
  pubDate: string
}

/** Señales internas: términos de topics presentes en preguntas/posts reales. */
export async function collectInternalSignals(): Promise<Map<string, number>> {
  const mentions = new Map<string, number>()

  const [messages, posts] = await Promise.all([
    db.contactMessage.findMany({
      select: { subject: true, message: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.communityPost.findMany({
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ])

  const texts = [
    ...messages.map((m) => `${m.subject} ${m.message}`),
    ...posts.map((p) => p.title),
  ].join(" ").toLowerCase()

  for (const topic of TOPICS) {
    const terms = [topic.title.toLowerCase(), topic.slug.replace(/-/g, " ")]
    if (topic.inci) terms.push(topic.inci.toLowerCase())
    const hits = terms.reduce((n, term) => (texts.includes(term) ? n + 1 : n), 0)
    if (hits > 0) mentions.set(topic.slug, hits)
  }
  return mentions
}

/** Artículos recientes de PubMed (últimos 90 días) para un tema. */
export async function collectPubmed(query: string): Promise<PubmedPaper[]> {
  const searchUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi" +
    `?db=pubmed&term=${encodeURIComponent(query)}` +
    "&reldate=90&datetype=pdat&retmax=3&sort=date&retmode=json"

  const search = await fetchJson<{ esearchresult?: { idlist?: string[] } }>(searchUrl)
  const ids = search.esearchresult?.idlist || []
  if (ids.length === 0) return []

  const summaryUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi" +
    `?db=pubmed&id=${ids.join(",")}&retmode=json`
  const summary = await fetchJson<Record<string, any>>(summaryUrl)

  return ids
    .map((id) => {
      const doc = summary?.result?.[id]
      if (!doc) return null
      return {
        pmid: id,
        title: String(doc.title || "").slice(0, 300),
        pubDate: String(doc.pubdate || doc.epubdate || ""),
      }
    })
    .filter((p): p is PubmedPaper => p !== null)
}

/** Resumen de Wikipedia para un tema (explicador). */
export async function collectWikipedia(title: string): Promise<{ url: string; title: string; extract: string } | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    const data = await fetchJson<{ type?: string; title?: string; extract?: string; content_urls?: { mobile?: { page?: string } } }>(url)
    if (data.type !== "standard" || !data.extract) return null
    return {
      url: data.content_urls?.mobile?.page || url,
      title: data.title || title,
      extract: data.extract.slice(0, 500),
    }
  } catch (e) {
    if (e instanceof SourceFetchError) {
      logger.debug("Wikipedia sin página para tema", { title })
    } else {
      logger.warn("Wikipedia fetch failed", { title, error: e instanceof Error ? e.message : String(e) })
    }
    return null
  }
}

/** Ficha COSING (UE) para un ingrediente INCI — HTML, extracción best-effort. */
export async function collectCosing(inci: string): Promise<{ url: string; title: string } | null> {
  try {
    const url = `https://ec.europa.eu/growth/tools-databases/cosing/search?q=${encodeURIComponent(inci)}`
    const html = await fetchText(url, 20000)
    // El detalle trae el nombre INCI en <h1> o en el título del resultado
    const match = html.match(/<h1[^>]*>([^<]{3,80})<\/h1>/i)
    const name = match?.[1]?.trim()
    if (!name) return null
    return { url, title: `COSING: ${name}` }
  } catch (e) {
    logger.debug("COSING sin resultado", { inci, error: e instanceof Error ? e.message : String(e) })
    return null
  }
}

export interface CollectResult {
  created: number
  updated: number
  skipped: number
  failed: number
  withInternalSignal: number
}

/**
 * Orquestador del recolector: candidatos → fuentes → persistencia.
 * `maxTopics` limita el coste por ejecución (control de rate limit de Groq
 * no aplica aquí — solo fuentes gratuitas; sí limita peticiones externas).
 */
export async function collectTrends(maxTopics = 6): Promise<CollectResult> {
  const result: CollectResult = { created: 0, updated: 0, skipped: 0, failed: 0, withInternalSignal: 0 }
  const internal = await collectInternalSignals()

  // Orden: primero los que tienen señal interna (prioridad de la audiencia)
  const ordered = [...TOPICS].sort((a, b) => (internal.get(b.slug) || 0) - (internal.get(a.slug) || 0))
  const batch = ordered.slice(0, maxTopics)

  for (const topic of batch) {
    try {
      const sources: Array<{ url: string; title: string; publisher: string; kind: string; publishedAt?: Date; excerpt?: string }> = []

      // 1) Evidencia científica reciente (siempre intentado)
      const papers = await collectPubmed(topic.query)
      for (const p of papers) {
        sources.push({
          url: `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`,
          title: p.title,
          publisher: "PubMed",
          kind: "paper",
          publishedAt: p.pubDate ? new Date(p.pubDate) : undefined,
          excerpt: undefined,
        })
      }

      // 2) Explicador enciclopédico
      const wiki = await collectWikipedia(topic.title)
      if (wiki) {
        sources.push({ url: wiki.url, title: wiki.title, publisher: "Wikipedia", kind: "encyclopedia", excerpt: wiki.extract })
      }

      // 3) Ficha oficial de ingrediente (solo ingredientes)
      if (topic.inci) {
        const cosing = await collectCosing(topic.inci)
        if (cosing) sources.push({ url: cosing.url, title: cosing.title, publisher: "COSING (UE)", kind: "ingredient-db" })
      }

      // Regla: mínimo 2 fuentes verificadas por tendencia
      if (sources.length < 2) {
        result.skipped++
        logger.info("Trend skipped: insufficient sources", { slug: topic.slug, sources: sources.length })
        continue
      }

      const mentions = internal.get(topic.slug) || 0
      const origin = mentions > 0 ? "both" : "external"

      const trend = await db.trend.upsert({
        where: { slug: topic.slug },
        create: {
          title: topic.title,
          slug: topic.slug,
          category: topic.category,
          origin,
          internalMentions: mentions,
          summary: sources[0]?.title || "",
          status: "detected",
        },
        update: {
          origin,
          internalMentions: mentions,
          lastSeenAt: new Date(),
        },
      })

      // Fuentes: la única en una transacción con la tendencia
      let trendUpdated = 0
      for (const s of sources) {
        await db.trendSource.upsert({
          where: { trendId_url: { trendId: trend.id, url: s.url } },
          create: {
            trendId: trend.id,
            url: s.url,
            title: s.title,
            publisher: s.publisher,
            kind: s.kind,
            publishedAt: s.publishedAt,
            excerpt: s.excerpt,
            fetchedAt: new Date(),
          },
          update: { fetchedAt: new Date(), title: s.title },
        })
        trendUpdated++
      }

      // created vs updated: upsert no distingue, lo deducimos por createdAt reciente
      const fresh = Date.now() - trend.createdAt.getTime() < 60_000
      if (fresh) result.created++
      else result.updated++
      if (origin === "both") result.withInternalSignal++

      logger.info("Trend collected", {
        slug: topic.slug,
        origin,
        sources: trendUpdated,
        internalMentions: mentions,
      })
    } catch (e) {
      result.failed++
      logger.error("Trend collection failed", {
        slug: topic.slug,
        error: e instanceof Error ? e.message : String(e),
      })
    }

    // Cortesía con las APIs públicas (PubMed pide ≤3 req/s)
    await new Promise((r) => setTimeout(r, 400))
  }

  return result
}
