import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { fetchJson, fetchText, SourceFetchError } from "@/lib/trends/sources"

/**
 * Recolector de tendencias (M1 del AI Growth Engine — fase correctiva).
 *
 * Descubre candidatos de DOS orígenes claramente distinguibles:
 *  - EXTERNOS: temas con actividad reciente en PubMed (evidencia científica)
 *  - INTERNOS: preguntas reales de usuarios (mensajes de contacto y posts
 *    de la comunidad) → se guarda en `origin` e `internalMentions` para
 *    NUNCA confundir interés propio con tendencia de mercado
 *
 * Calidad de fuentes (fase correctiva):
 *  - PubMed: búsqueda restringida a [Title/Abstract] + validación de
 *    relevancia del título/abstract contra el tema (términos positivos y
 *    lista de rechazo fuera de dominio). Se conservan PMID y URL reales;
 *    nunca se inventan resúmenes: el `excerpt` es el abstract real.
 *  - Wikipedia: mapeo explícito slug → título EN (la API REST oficial ya
 *    sigue redirecciones; el fallo de búsqueda NO descarta la tendencia).
 *  - COSING: eliminado del collector — existe API oficial
 *    (api.tech.ec.europa.eu/cosing20/1.0) pero exige API key propia y la
 *    clave pública de su config no la tiene (401). Sin scraping de la SPA.
 *    Ver docs/CRON-TRENDS.md.
 *
 * En M1 no se puntúa nada; el scoring llega en M2.
 */

export interface Topic {
  slug: string
  /** Título de display en español. */
  title: string
  category: string
  /** Términos de búsqueda PubMed (se envían agrupados y con [Title/Abstract]). */
  query: string
  /** Título EN de Wikipedia (mapeo explícito — los títulos ES no existen en en.wikipedia). */
  wikiTitle: string
  /** Frases que justifican que el artículo trate sobre el tema (título O abstract). */
  relevant: string[]
  /** Frases que descartan el artículo por estar fuera del tema (título). */
  reject?: string[]
  /** Nombre INCI — solo para señales internas. */
  inci?: string
}

/**
 * Fuera de dominio compartido por todos los temas de skincare.
 * Se evalúa SOLO contra el título (un artículo válido puede mencionar de
 * pasada estas palabras en el abstract).
 */
const OFF_DOMAIN_REJECTS = [
  "gut", "gut organ", "gutorgan",
  "intestine", "intestinal",
  "microbiota", "microbiome",
  "probiotic", "probiotics", "prebiotic", "prebiotics",
  "macular", "retina", "retinal pigment", "amd", "rpe",
  "cornea", "corneal", "uveitis", "ocular", "ophthalmology", "ophthalmic",
  "botulinum", "botox",
]

/** Alcance temático del producto (audiencia: piel latina, clima caribeño). */
export const TOPICS: Topic[] = [
  {
    slug: "niacinamide", title: "Niacinamida", category: "ingredient",
    query: "niacinamide skin", wikiTitle: "Nicotinamide",
    relevant: ["niacinamide", "nicotinamide"], inci: "NIACINAMIDE",
  },
  {
    slug: "retinol", title: "Retinol", category: "ingredient",
    query: "retinol skin aging", wikiTitle: "Retinol",
    relevant: ["retinol", "retinoid", "retinoids"], inci: "RETINOL",
  },
  {
    slug: "acido-hialuronico", title: "Ácido hialurónico", category: "ingredient",
    query: "hyaluronic acid skin", wikiTitle: "Hyaluronic acid",
    relevant: ["hyaluronic acid", "hyaluronan", "hyaluronate"], inci: "HYALURONIC ACID",
  },
  {
    slug: "protector-solar", title: "Protector solar", category: "ingredient",
    query: "sunscreen photoprotection", wikiTitle: "Sunscreen",
    relevant: ["sunscreen", "sunscreens", "photoprotection", "sun protection", "sunblock", "solar protection", "spf"],
  },
  {
    slug: "barrera-cutanea", title: "Barrera cutánea", category: "concern",
    query: "skin barrier function", wikiTitle: "Stratum corneum",
    relevant: [
      "skin barrier", "barrier function", "stratum corneum", "epidermal barrier",
      "transepidermal", "tewl", "moisturizer", "moisturizing", "moisturiser",
      "hydration", "hydrator", "ichthyosis", "atopic dermatitis", "eczema",
    ],
    reject: ["diet", "diets", "dietary", "food", "foods", "egg", "eggs", "nutrition", "nutritional", "supplement", "supplements"],
  },
  {
    slug: "hiperpigmentacion", title: "Hiperpigmentación", category: "concern",
    query: "skin hyperpigmentation", wikiTitle: "Hyperpigmentation",
    relevant: [
      "hyperpigmentation", "hyperpigmented", "melasma", "pigmentation",
      "tyrosinase", "melanin", "melanogenesis", "whitening", "lightening",
    ],
  },
  {
    slug: "acne", title: "Acné", category: "concern",
    query: "acne treatment skin", wikiTitle: "Acne",
    relevant: ["acne", "acneic"],
  },
  {
    slug: "piel-sensible", title: "Piel sensible", category: "concern",
    query: "sensitive skin irritation", wikiTitle: "Sensitive skin",
    relevant: ["sensitive skin", "skin sensitivity", "skin sensitiveness", "irritation", "irritant", "irritancy", "stinging"],
  },
  {
    slug: "vitamina-c", title: "Vitamina C tópica", category: "ingredient",
    query: "topical vitamin C skin", wikiTitle: "Vitamin C",
    relevant: ["vitamin c", "ascorbic acid", "ascorbate"], inci: "ASCORBIC ACID",
  },
  {
    slug: "ceramidas", title: "Ceramidas", category: "ingredient",
    query: "ceramides skin barrier", wikiTitle: "Ceramide",
    relevant: ["ceramide", "ceramides"], inci: "CERAMIDE NP",
  },
  {
    slug: "exfoliacion", title: "Exfoliación química", category: "ingredient",
    query: "chemical exfoliation skin", wikiTitle: "Exfoliation (cosmetology)",
    relevant: ["exfoliation", "exfoliating", "exfoliant", "exfoliants", "aha", "bha", "glycolic acid", "salicylic acid", "chemical peel"],
    reject: ["cancer", "carcinoma", "tumor", "tumors", "tumour", "tumours"],
  },
  {
    slug: "envejecimiento-cutaneo", title: "Envejecimiento cutáneo", category: "research",
    query: "skin aging prevention", wikiTitle: "Photoaging",
    relevant: ["skin aging", "skin ageing", "photoaging", "cutaneous aging", "cutaneous ageing", "wrinkle", "wrinkles"],
  },
]

export interface PubmedPaper {
  pmid: string
  title: string
  /** Abstract REAL tal cual viene de PubMed (vacío si el registro no lo trae). */
  abstract: string
  /** Fecha completa solo si el registro la trae; si no, null (no se inventa). */
  publishedAt: Date | null
}

/** Escapa regex y permite espacios flexibles entre palabras de una frase. */
function phraseRegex(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")
  return new RegExp(`\\b${escaped}\\b`, "i")
}

/**
 * ¿Es este artículo sobre el tema?
 *  - RECHAZO: alguna frase de rechazo (del tema o fuera de dominio) en el TÍTULO.
 *  - RELEVANCIA: frase relevante en el TÍTULO → conserva.
 *    Si solo está en el abstract → exige ≥2 frases DIFERENTES del tema
 *    (un solo término genérico ("irritation", "pigmentation") en el abstract
 *    de un paper clínico no demuestra que trate el tema).
 * No se exige la palabra exacta de la query: sinónimos y términos
 * semánticos cubren artículos válidos que no usan la query literal.
 */
export function isRelevantPaper(topic: Topic, title: string, abstract: string): boolean {
  const titleLc = title.toLowerCase()
  const rejects = [...OFF_DOMAIN_REJECTS, ...(topic.reject || [])]
  for (const r of rejects) {
    if (phraseRegex(r).test(titleLc)) return false
  }
  if (topic.relevant.some((rel) => phraseRegex(rel).test(titleLc))) return true
  const absLc = abstract.toLowerCase()
  const distinctInAbstract = topic.relevant.filter((rel) => phraseRegex(rel).test(absLc)).length
  return distinctInAbstract >= 2
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/** Extrae fecha SOLO si el registro trae año+mes+ día explícitos. */
function parseDate(block: string): Date | null {
  const full = block.match(
    /<(?:ArticleDate|PubDate)>[\s\S]*?<Year>(\d{4})<\/Year>[\s\S]*?<Month>(\d{1,2}|[A-Za-z]{3})<\/Month>[\s\S]*?<Day>(\d{1,2})<\/Day>[\s\S]*?<\/(?:ArticleDate|PubDate)>/
  )
  if (!full) return null
  const year = parseInt(full[1], 10)
  const monthRaw = full[2]
  const month = /^\d+$/.test(monthRaw) ? parseInt(monthRaw, 10) - 1 : MONTHS[monthRaw.toLowerCase().slice(0, 3)]
  const day = parseInt(full[3], 10)
  if (month === undefined || isNaN(month) || month < 0 || month > 11) return null
  return new Date(year, month, day)
}

/** Parsea el XML de efetch en papers crudos (SIN validar relevancia). */
export function parsePubmedXml(xml: string): PubmedPaper[] {
  const papers: PubmedPaper[] = []
  const blocks = xml.split("<PubmedArticle>").slice(1)
  for (const block of blocks) {
    const pmid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1]
    const titleRaw = block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]
    if (!pmid || !titleRaw) continue
    const title = stripTags(titleRaw)
    if (!title) continue
    const abstract = Array.from(block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g))
      .map((m) => stripTags(m[1]))
      .join(" ")
    papers.push({ pmid, title, abstract, publishedAt: parseDate(block) })
  }
  return papers
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

/**
 * Candidatos de PubMed (últimos 90 días), restringidos a [Title/Abstract]
 * y SIN validar todavía. La validación de relevancia es `isRelevantPaper`.
 */
export async function fetchPubmedCandidates(topic: Topic): Promise<PubmedPaper[]> {
  const searchUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi" +
    `?db=pubmed&term=${encodeURIComponent(`(${topic.query})[Title/Abstract]`)}` +
    "&reldate=90&datetype=pdat&retmax=10&sort=date&retmode=json"

  const search = await fetchJson<{ esearchresult?: { idlist?: string[] } }>(searchUrl)
  const ids = search.esearchresult?.idlist || []
  if (ids.length === 0) return []

  // efetch en una sola petición: título + abstract reales + fecha del registro
  const efetchUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi" +
    `?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml`
  const xml = await fetchText(efetchUrl, 20000)
  return parsePubmedXml(xml)
}

/** Artículos relevantes y verificables de PubMed para un tema. */
export async function collectPubmed(topic: Topic): Promise<PubmedPaper[]> {
  const candidates = await fetchPubmedCandidates(topic)
  const kept = candidates.filter((p) => isRelevantPaper(topic, p.title, p.abstract))
  if (candidates.length > 0 && kept.length < candidates.length) {
    logger.debug("PubMed: artículos descartados por relevancia", {
      slug: topic.slug,
      candidates: candidates.length,
      kept: kept.length,
    })
  }
  return kept
}

/**
 * Resumen de Wikipedia vía API REST oficial con el título EN mapeado.
 * Un fallo de red NO es ausencia de tendencia: devuelve null y el resto
 * del pipeline sigue (la tendencia se crea con las fuentes que sí haya).
 */
export async function collectWikipedia(topic: Topic): Promise<{ url: string; title: string; extract: string } | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.wikiTitle)}`
    const data = await fetchJson<{ type?: string; title?: string; extract?: string; content_urls?: { mobile?: { page?: string } } }>(url)
    if (data.type !== "standard" || !data.extract) {
      logger.debug("Wikipedia sin página para tema", { slug: topic.slug, wikiTitle: topic.wikiTitle })
      return null
    }
    return {
      url: data.content_urls?.mobile?.page || url,
      title: data.title || topic.wikiTitle,
      extract: data.extract.slice(0, 500),
    }
  } catch (e) {
    // Fallo de red/timeout: se registra como indisponibilidad, no como "sin tendencia"
    logger.warn("Wikipedia fetch failed (indisponible, no descarta el tema)", {
      slug: topic.slug,
      error: e instanceof Error ? e.message : String(e),
    })
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
 * `maxTopics` limita el coste por ejecución (solo fuentes gratuitas).
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

      // 1) Evidencia científica reciente (siempre intentado) — ya validada
      const papers = await collectPubmed(topic)
      for (const p of papers) {
        sources.push({
          url: `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`, // PMID verificable en la URL
          title: p.title,
          publisher: "PubMed",
          kind: "paper",
          publishedAt: p.publishedAt || undefined,
          // Abstract REAL (no inventado), truncado a 400 chars
          excerpt: p.abstract ? p.abstract.slice(0, 400) : undefined,
        })
      }

      // 2) Explicador enciclopédico (título EN mapeado)
      const wiki = await collectWikipedia(topic)
      if (wiki) {
        sources.push({ url: wiki.url, title: wiki.title, publisher: "Wikipedia", kind: "encyclopedia", excerpt: wiki.extract })
      }

      // 3) COSING: eliminado (API oficial requiere API key propia; ver docs/CRON-TRENDS.md)

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
