import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockCache } = vi.hoisted(() => ({
  mockCache: {} as Record<string, unknown>,
}))

vi.mock("@/lib/cache/db-cache", () => ({
  getDBCache: (key: string) => Promise.resolve(mockCache[key] || null),
  setDBCache: (key: string, value: unknown) => {
    mockCache[key] = value
    return Promise.resolve()
  },
}))

import { searchAffiliateProducts, buildAffiliateLink } from "../affiliate.service"

describe("searchAffiliateProducts", () => {
  beforeEach(() => {
    Object.keys(mockCache).forEach((k) => delete mockCache[k])
  })

  it("returns cached results without calling API", async () => {
    const cached = [{ title: "Moisturizer", url: "https://amazon.com/moisturizer" }]
    mockCache["affiliate:search:moisturizer"] = cached

    const result = await searchAffiliateProducts("Moisturizer")
    expect(result).toEqual(cached)
  })

  it("returns empty array on API failure", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

    const result = await searchAffiliateProducts("face cream")
    expect(result).toEqual([])
  })

  it("returns empty array on timeout", async () => {
    const controller = new AbortController()
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      opts?.signal?.addEventListener("abort", () => {})
      return new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 100)
      })
    })

    const result = await searchAffiliateProducts("serum")
    expect(result).toEqual([])
  })

  it("returns empty array when API returns non-ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })

    const result = await searchAffiliateProducts("vitamin c")
    expect(result).toEqual([])
  })

  it("adds affiliate tag to product URLs", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          search_results: [
            {
              title: "Vitamin C Serum",
              link: "https://amazon.com/vitamin-c",
              price: { value: 25.99 },
              image: "https://amazon.com/img.jpg",
            },
          ],
        }),
    })

    const result = await searchAffiliateProducts("vitamin c serum")

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("Vitamin C Serum")
    expect(result[0].url).toContain("tag=serenelens-20")
    expect(result[0].price).toBe("$25.99")
    expect(result[0].imageUrl).toBe("https://amazon.com/img.jpg")
  })
})

describe("buildAffiliateLink", () => {
  it("adds tag parameter with ? separator", () => {
    const result = buildAffiliateLink("https://amazon.com/product")
    expect(result).toBe("https://amazon.com/product?tag=serenelens-20")
  })

  it("adds tag parameter with & separator when URL already has query", () => {
    const result = buildAffiliateLink("https://amazon.com/product?ref=123")
    expect(result).toBe("https://amazon.com/product?ref=123&tag=serenelens-20")
  })
})
