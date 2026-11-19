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
import { collectTrends } from "@/lib/trends/collector"

const fetchMock = vi.fn()

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
}

/** Respuestas por defecto: PubMed con 1 paper, Wikipedia con extract, COSING con h1. */
function happyFetch() {
  fetchMock.mockImplementation(async (url: string) => {
    const u = String(url)
    if (u.includes("esearch.fcgi")) return jsonResponse({ esearchresult: { idlist: ["12345"] } })
    if (u.includes("esummary.fcgi"))
      return jsonResponse({ result: { "12345": { title: "Niacinamide and skin barrier", pubdate: "2026 Jan" } } })
    if (u.includes("wikipedia.org/api/rest_v1"))
      return jsonResponse({
        type: "standard",
        title: "Nicotinamide",
        extract: "Niacinamide is a form of vitamin B3.",
        content_urls: { mobile: { page: "https://en.m.wikipedia.org/wiki/Nicotinamide" } },
      })
    if (u.includes("cosing")) return new Response("<h1>NIACINAMIDE</h1>", { status: 200 })
    return new Response("not found", { status: 404 })
  })
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
    expect(isAllowedUrl("https://ec.europa.eu/growth/tools-databases/cosing/search?q=x")).toBe(true)
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
    expect(isAllowedUrl("ftp://en.wikipedia.org/x")).toBe(false)
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

describe("collectTrends", () => {
  it("creates a trend with verified sources (PubMed + Wikipedia + COSING)", async () => {
    happyFetch()

    const result = await collectTrends(1)

    expect(result.created).toBe(1)
    expect(result.failed).toBe(0)
    expect(result.skipped).toBe(0)
    // upsert de tendencia con dedup por slug
    expect(mockTrendUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "niacinamide" } })
    )
    // ≥2 fuentes persistidas, cada una con unique [trendId, url]
    expect(mockSourceUpsert).toHaveBeenCalledTimes(3)
    expect(mockSourceUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { trendId_url: { trendId: "trend_1", url: expect.stringContaining("pubmed") } } })
    )
  }, 15000)

  it("distinguishes internal interest: mentions set origin=both", async () => {
    happyFetch()
    mockMessages.mockResolvedValue([{ subject: "Duda con niacinamida", message: "¿la niacinamida sirve para acné?" }])

    const result = await collectTrends(1)

    expect(result.withInternalSignal).toBe(1)
    expect(mockTrendUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ origin: "both", internalMentions: expect.any(Number) }),
      })
    )
    const mentions = mockTrendUpsert.mock.calls[0][0].create.internalMentions
    expect(mentions).toBeGreaterThan(0)
  }, 15000)

  it("skips topics with fewer than 2 verified sources (no fabrication)", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url)
      if (u.includes("esearch.fcgi")) return jsonResponse({ esearchresult: { idlist: [] } })
      if (u.includes("wikipedia.org/api/rest_v1")) return jsonResponse({ type: "no_extract" })
      if (u.includes("cosing")) return new Response("<html><body>sin ficha</body></html>", { status: 200 })
      return new Response("{}", { status: 200 })
    })

    const result = await collectTrends(1)

    expect(result.skipped).toBe(1)
    expect(result.created).toBe(0)
    expect(mockTrendUpsert).not.toHaveBeenCalled()
    expect(mockSourceUpsert).not.toHaveBeenCalled()
  }, 15000)

  it("continues after a topic failure instead of aborting the batch", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url)
      if (u.includes("esearch.fcgi")) {
        // el primer tema (niacinamide) falla siempre; el segundo responde
        if (u.includes("niacinamide")) throw new Error("PubMed caído")
        return jsonResponse({ esearchresult: { idlist: ["999"] } })
      }
      if (u.includes("esummary.fcgi"))
        return jsonResponse({ result: { "999": { title: "Retinol study", pubdate: "2026 Feb" } } })
      if (u.includes("wikipedia.org/api/rest_v1"))
        return jsonResponse({ type: "standard", title: "Retinol", extract: "Retinol is vitamin A." })
      if (u.includes("cosing")) return new Response("<h1>RETINOL</h1>", { status: 200 })
      return new Response("{}", { status: 200 })
    })

    const result = await collectTrends(2)

    // primer tema falla (PubMed con reintento agotado), segundo se crea
    expect(result.failed).toBe(1)
    expect(result.created).toBe(1)
  }, 20000)
})
