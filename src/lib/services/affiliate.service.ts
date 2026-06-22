import { getDBCache, setDBCache } from "@/lib/cache/db-cache"

interface AffiliateProduct {
  title: string
  url: string
  price?: string
  imageUrl?: string
}

export async function searchAffiliateProducts(query: string): Promise<AffiliateProduct[]> {
  const cacheKey = `affiliate:search:${query.toLowerCase().trim()}`
  const cached = await getDBCache<AffiliateProduct[]>(cacheKey)
  if (cached) return cached

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://api.rainforestapi.com/request?api_key=${process.env.RAINFOREST_API_KEY || ""}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(query)}&exclude_sponsored=true`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (!response.ok) return []

    const data = await response.json()
    const products: AffiliateProduct[] = (data.search_results || []).map((item: any) => ({
      title: item.title || "",
      url: `${item.link || ""}&tag=serenelens-20`,
      price: item.price?.value ? `$${item.price.value}` : undefined,
      imageUrl: item.image || undefined,
    }))

    await setDBCache(cacheKey, products, 86400)
    return products
  } catch {
    return []
  }
}

export function buildAffiliateLink(baseUrl: string, provider = "amazon"): string {
  const tagMap: Record<string, string> = {
    amazon: "serenelens-20",
    iherb: "serenelens-20",
  }

  const tag = tagMap[provider] || "serenelens-20"
  const separator = baseUrl.includes("?") ? "&" : "?"
  return `${baseUrl}${separator}tag=${tag}`
}
