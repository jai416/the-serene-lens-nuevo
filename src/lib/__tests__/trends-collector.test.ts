import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const { mockTrendUpsert, mockSourceUpsert, mockMessages, mockPosts } = vi.hoisted(() => ({
  mockTrendUpsert: vi.fn(),
  mockSourceUpsert: vi.fn(),
  mockMessages: vi.fn(),
  mockPosts: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    contactMessage: { findMany: mockMessages },
    communityPost: { findMany: mockPosts },
    trend: { upsert: mockTrendUpsert },
    trendSource: { upsert: mockSourceUpsert },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { isAllowedUrl, fetchText, slugify, SourceFetchError } from "@/lib/trends/sources"
import {
  TOPICS,
  isRelevantPaper,
  parsePubmedXml,
  fetchPubmedCandidates,
  collectPubmed,
  collectWikipedia,
  collectTrends,
  type Topic,
} from "@/lib/trends/collector"

const fetchMock = vi.fn()

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
}

/** Bloque <PubmedArticle> realista para efetch. */
function xmlPaper(pmid: string, title: string, abstract = "", date?: { y: number; m: number; d: number }): string {
  const dateXml = date
    ? `<ArticleDate><Year>${date.y}</Year><Month>${date.m}</Month><Day>${date.d}</Day></ArticleDate>`
    : ""
  const absXml = abstract ? `<Abstract><AbstractText>${abstract}</AbstractText></Abstract>` : "<Abstract/>"
  return (
    `<PubmedArticle><MedlineCitation><PMID Version="1">${pmid}</PMID><Article>` +
    `<ArticleTitle>${title}</ArticleTitle>${absXml}${dateXml}` +
    `</Article></MedlineCitation></PubmedArticle>`
  )
}

const WIKI_NICOTINAMIDE = {
  type: "standard",
  title: "Nicotinamide",
  extract: "Nicotinamide is a form of vitamin B3.",
  content_urls: { mobile: { page: "https://en.m.wikipedia.org/wiki/Nicotinamide" } },
}

/**
 * Router de fetch por URL:
 *  - esearch → ids configuradas
 *  - efetch  → XML configurado
 *  - wikipedia → wiki JSON (o throw si wikiFails)
 *  - cualquier otra → 404
 */
function routeFetch(opts: { ids?: string[]; xml?: string; wiki?: unknown; wikiFails?: boolean }) {
  return async (url: string) => {
    const u = String(url)
    if (u.includes("esearch.fcgi")) return jsonResponse({ esearchresult: { idlist: opts.ids || [] } })
    if (u.includes("efetch.fcgi")) return new Response(opts.xml || "", { status: 200 })
    if (u.includes("rest_v1/page/summary")) {
      if (opts.wikiFails) throw new Error("network down")
      return jsonResponse(opts.wiki ?? { type: "no_extract" })
    }
    return new Response("not found", { status: 404 })
  }
}

const topic = (slug: string): Topic => {
  const t = TOPICS.find((x) => x.slug === slug)
  if (!t) throw new Error(`topic desconocido: ${slug}`)
  return t
}

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.fetch = fetchMock as unknown as typeof fetch
  mockMessages.mockResolvedValue([])
  mockPosts.mockResolvedValue([])
  mockTrendUpsert.mockResolvedValue({ id: "trend_1", slug: "niacinamide", createdAt: new Date() })
  mockSourceUpsert.mockResolvedValue({})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("isAllowedUrl (anti-SSRF)", () => {
  it("allows hosts on the allowlist", () => {
    expect(isAllowedUrl("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed")).toBe(true)
    expect(isAllowedUrl("https://en.wikipedia.org/api/rest_v1/page/summary/Niacinamide")).toBe(true)
  })

  it("rejects COSING (eliminado: API con key propia, sin scraping)", () => {
    expect(isAllowedUrl("https://ec.europa.eu/growth/tools-databases/cosing/search?q=x")).toBe(false)
  })

  it("rejects any other host", () => {
    expect(isAllowedUrl("https://evil.example.com/steal")).toBe(false)
    expect(isAllowedUrl("https://eutils.ncbi.nlm.nih.gov.evil.com/x")).toBe(false)
    expect(isAllowedUrl("http://169.254.169.254/latest/meta-data/")).toBe(false)
    expect(isAllowedUrl("https://127.0.0.1/")).toBe(false)
  })

  it("rejects credentials, non-http protocols and garbage", () => {
    expect(isAllowedUrl("https://user:pass@en.wikipedia.org/x")).toBe(false)
    expect(isAllowedUrl("file:///etc/passwd")).toBe(false)
    expect(isAllowedUrl("not a url")).toBe(false)
  })
})

describe("fetchText", () => {
  it("refuses to fetch a non-allowlisted URL without calling fetch", async () => {
    await expect(fetchText("https://evil.example.com")).rejects.toBeInstanceOf(SourceFetchError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("retries once and then throws SourceFetchError", async () => {
    fetchMock.mockRejectedValue(new Error("network down"))
    await expect(fetchText("https://en.wikipedia.org/api/rest_v1/page/summary/x")).rejects.toBeInstanceOf(SourceFetchError)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  }, 10000)
})

describe("slugify", () => {
  it("normalizes accents, case and separators", () => {
    expect(slugify("Ácido Hialurónico")).toBe("acido-hialuronico")
    expect(slugify("  Niacinamide  ")).toBe("niacinamide")
  })
})

describe("isRelevantPaper — validación de relevancia", () => {
  it("conserva artículos relevantes (sin exigir la palabra exacta de la query)", () => {
    // la query es "skin barrier function" pero "stratum corneum" es sinónimo válido
    const t = topic("barrera-cutanea")
    expect(
      isRelevantPaper(t, "Ceramides in the stratum corneum of aging skin", "Transepidermal water loss was reduced.")
    ).toBe(true)
    expect(isRelevantPaper(topic("niacinamide"), "Niacinamide improves barrier function", "")).toBe(true)
    expect(isRelevantPaper(topic("vitamina-c"), "Topical ascorbic acid photoprotection", "")).toBe(true)
  })

  it("descarta falsos positivos de fuera de dominio (título)", () => {
    const t = topic("barrera-cutanea")
    // microbiota intestinal
    expect(isRelevantPaper(t, "Harnessing the Gutorgan axis: the potential of probiotics for healthy aging", "")).toBe(false)
    // AMD / retina
    expect(
      isRelevantPaper(t, "Cerium-polyphenol network protects against AMD-associated RPE degeneration via barrier", "")
    ).toBe(false)
    // botulinum toxin
    expect(
      isRelevantPaper(topic("niacinamide"), "Prolonging the Efficacy of Botulinum Toxin A Using a Novel Toxin Mimetic Complex", "")
    ).toBe(false)
    // dermatitis por alimentos (rechazo específico de barrera-cutánea)
    expect(
      isRelevantPaper(t, "Impact of regular consumption of eggs and nutrient-fortified eggs on atopic dermatitis", "")
    ).toBe(false)
  })

  it("descarta artículos tangenciales sin términos relevantes del tema", () => {
    // protector solar: artículo de dermatología en atletas sin nada de fotoprotección
    expect(
      isRelevantPaper(topic("protector-solar"), "Dermatological conditions in endurance athletes: prevalence and associated factors", "Sun exposure was self-reported.")
    ).toBe(false)
    // niacinamida: artículo sin ninguna mención del compuesto en título ni abstract
    expect(isRelevantPaper(topic("niacinamide"), "Randomized trial of facial massage outcomes", "Skin hydration improved in both groups.")).toBe(false)
  })

  it("el rechazo solo mira el título (el abstract puede mencionar algo de pasada)", () => {
    const t = topic("barrera-cutanea")
    // "dietary/supplement" solo en el abstract → NO descarta
    expect(
      isRelevantPaper(t, "Stratum corneum lipids in atopic dermatitis", "Patients received dietary supplements for 12 weeks.")
    ).toBe(true)
    // pero si la frase de rechazo está en el TÍTULO → descarta
    expect(
      isRelevantPaper(t, "Dietary supplements and barrier function", "Stratum corneum was measured by TEWL.")
    ).toBe(false)
  })
})

describe("parsePubmedXml", () => {
  it("extrae PMID, título con tags anidados, abstract y fecha real", () => {
    const xml =
      `<PubmedArticleSet>` +
      xmlPaper("12345", "Niacinamide <i>skin</i> benefits &amp; more", "Abstract one. Abstract two.", { y: 2026, m: 3, d: 15 }) +
      xmlPaper("67890", "Second paper", "") +
      `</PubmedArticleSet>`
    const papers = parsePubmedXml(xml)
    expect(papers).toHaveLength(2)
    expect(papers[0]).toMatchObject({ pmid: "12345", title: "Niacinamide skin benefits & more" })
    expect(papers[0].abstract).toBe("Abstract one. Abstract two.")
    expect(papers[0].publishedAt).toEqual(new Date(2026, 2, 15))
    // sin fecha completa en el registro → null (no se inventa)
    expect(papers[1].publishedAt).toBeNull()
    expect(papers[1].abstract).toBe("")
  })

  it("ignora registros sin PMID o sin título", () => {
    const xml = `<PubmedArticle><MedlineCitation><PMID>1</PMID><Article><Abstract><AbstractText>x</AbstractText></Abstract></Article></MedlineCitation></PubmedArticle>` +
      xmlPaper("2", "Con título")
    expect(parsePubmedXml(xml)).toHaveLength(1)
  })
})

describe("fetchPubmedCandidates — consulta Title/Abstract", () => {
  it("envía la query agrupada con [Title/Abstract]", async () => {
    fetchMock.mockImplementation(routeFetch({ ids: ["111"], xml: xmlPaper("111", "Niacinamide study") }))
    const papers = await fetchPubmedCandidates(topic("niacinamide"))
    expect(papers).toHaveLength(1)
    const esearchCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("esearch.fcgi"))
    expect(esearchCall).toBeDefined()
    const decoded = decodeURIComponent(String(esearchCall![0]))
    expect(decoded).toContain("(niacinamide skin)[Title/Abstract]")
  })
})

describe("collectPubmed — filtrado real", () => {
  it("conserva solo los relevantes de entre los candidatos", async () => {
    const xml =
      xmlPaper("111", "Niacinamide improves skin barrier function in photoaged skin", "Niacinamide 5% reduced TEWL.") +
      xmlPaper("222", "Botulinum Toxin A for facial wrinkles: a review", "") +
      xmlPaper("333", "Probiotics and the gut-skin axis", "") +
      xmlPaper("444", "Dietary patterns and skin hydration in adults", "")
    fetchMock.mockImplementation(routeFetch({ ids: ["111", "222", "333", "444"], xml }))
    const kept = await collectPubmed(topic("niacinamide"))
    expect(kept.map((p) => p.pmid)).toEqual(["111"]) // 222/333/444 descartados
    expect(kept[0].abstract).toContain("Niacinamide 5%")
  })
})

describe("collectWikipedia — mapeo de título EN", () => {
  it("usa el título EN mapeado, no el español", async () => {
    fetchMock.mockImplementation(routeFetch({ wiki: WIKI_NICOTINAMIDE }))
    const wiki = await collectWikipedia(topic("niacinamide"))
    expect(wiki?.title).toBe("Nicotinamide")
    const call = fetchMock.mock.calls.find((c) => String(c[0]).includes("rest_v1"))
    expect(decodeURIComponent(String(call![0]))).toContain("/summary/Nicotinamide")
    expect(decodeURIComponent(String(call![0]))).not.toContain("Niacinamida")
  })

  it("un fallo de red devuelve null sin lanzar (no rompe el lote)", async () => {
    fetchMock.mockImplementation(routeFetch({ wikiFails: true }))
    await expect(collectWikipedia(topic("acne"))).resolves.toBeNull()
  })
})

describe("collectTrends", () => {
  it("crea tendencia con fuentes validadas: solo papers relevantes + wiki, URL de PMID válida", async () => {
    const xml =
      xmlPaper("43047181", "Niacinamide: Advances in Skin Whitening Agents", "Niacinamide inhibits melanosome transfer.") +
      xmlPaper("43047229", "Prolonging the Efficacy of Botulinum Toxin A Using a Novel Toxin Mimetic Complex", "")
    fetchMock.mockImplementation(routeFetch({ ids: ["43047181", "43047229"], xml, wiki: WIKI_NICOTINAMIDE }))

    const result = await collectTrends(1)

    expect(result.created).toBe(1)
    expect(result.failed).toBe(0)
    expect(result.skipped).toBe(0)

    // la consulta debe ir restringida a [Title/Abstract]
    const esearchCall = fetchMock.mock.calls.find((c) => String(c[0]).includes("esearch.fcgi"))
    expect(decodeURIComponent(String(esearchCall![0]))).toContain("[Title/Abstract]")

    // el paper de botulinum NO debe persistirse
    const persistedUrls = mockSourceUpsert.mock.calls.map((c) => c[0].create.url as string)
    expect(persistedUrls.some((u) => u.includes("43047229"))).toBe(false)
    // el PMID válido y verificable sí
    expect(persistedUrls).toContain("https://pubmed.ncbi.nlm.nih.gov/43047181/")
    expect(persistedUrls.some((u) => /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(u))).toBe(true)
    // y la wiki con el título EN
    expect(persistedUrls.some((u) => u.includes("Nicotinamide"))).toBe(true)
    expect(persistedUrls.every((u) => u.startsWith("https://"))).toBe(true)
  }, 15000)

  it("distingue interés propio: señales internas → origin=both", async () => {
    const xml = xmlPaper("111", "Niacinamide for acne-prone skin", "Niacinamide reduces lesions.")
    fetchMock.mockImplementation(routeFetch({ ids: ["111"], xml, wiki: WIKI_NICOTINAMIDE }))
    mockMessages.mockResolvedValue([{ subject: "Duda con niacinamida", message: "¿la niacinamida sirve para acné?" }])

    const result = await collectTrends(1)

    expect(result.withInternalSignal).toBe(1)
    expect(mockTrendUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ origin: "both", internalMentions: expect.any(Number) }),
      })
    )
    expect(mockTrendUpsert.mock.calls[0][0].create.internalMentions).toBeGreaterThan(0)
  }, 15000)

  it("Wikipedia caída NO descarta la tendencia si hay ≥2 papers válidos", async () => {
    const xml =
      xmlPaper("111", "Niacinamide restores barrier function", "Niacinamide 5% improved barrier.") +
      xmlPaper("222", "Topical nicotinamide in photoaged skin", "Nicotinamide improved elasticity.")
    fetchMock.mockImplementation(routeFetch({ ids: ["111", "222"], xml, wikiFails: true }))

    const result = await collectTrends(1)

    expect(result.created).toBe(1)
    expect(result.failed).toBe(0)
    const persistedUrls = mockSourceUpsert.mock.calls.map((c) => c[0].create.url as string)
    expect(persistedUrls).toHaveLength(2)
    expect(persistedUrls.every((u) => u.includes("pubmed"))).toBe(true)
  }, 15000)

  it("descarta candidatos irrelevantes y salta si quedan <2 fuentes (sin fabricar)", async () => {
    const xml =
      xmlPaper("999", "Gut microbiota diversity in aging populations", "Probiotic supplementation altered microbial composition.")
    fetchMock.mockImplementation(routeFetch({ ids: ["999"], xml, wiki: { type: "no_extract" } }))

    const result = await collectTrends(1)

    expect(result.skipped).toBe(1)
    expect(result.created).toBe(0)
    expect(mockTrendUpsert).not.toHaveBeenCalled()
    expect(mockSourceUpsert).not.toHaveBeenCalled()
  }, 15000)

  it("continúa el batch aunque PubMed falle en un tema", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url)
      if (u.includes("esearch.fcgi")) {
        if (u.includes("niacinamide")) throw new Error("PubMed caído") // ambos reintentos fallan
        return jsonResponse({ esearchresult: { idlist: ["999"] } })
      }
      if (u.includes("efetch.fcgi")) {
        return new Response(
          xmlPaper("999", "Retinol stimulates collagen synthesis", "Retinol upregulated type I collagen."),
          { status: 200 }
        )
      }
      if (u.includes("rest_v1/page/summary")) {
        return jsonResponse({ type: "standard", title: "Retinol", extract: "Retinol is vitamin A.", content_urls: { mobile: { page: "https://en.m.wikipedia.org/wiki/Retinol" } } })
      }
      return new Response("{}", { status: 200 })
    })

    const result = await collectTrends(2)

    expect(result.failed).toBe(1) // niacinamide: PubMed con reintento agotado
    expect(result.created).toBe(1) // retinol: se crea con 1 paper + wiki
  }, 20000)
})
