import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCache, setCache } from "@/lib/cache"
import { logger } from "@/lib/logger"
import { serverError } from "@/lib/api-response"

const CACHE_TTL = 3600

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50)
    const category = searchParams.get("category")
    const cacheKey = `products:${category || "all"}:${limit}`

    const cached = getCache<any[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, data: { products: cached }, cached: true }, {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
      })
    }

    logger.info("Products cache miss", { cacheKey })

    const where = category && category !== "all" ? { category, isActive: true } : { isActive: true }

    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDesc: true,
        image: true,
        category: true,
        skinTypes: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    })

    setCache(cacheKey, products, CACHE_TTL)

    return NextResponse.json({ success: true, data: { products } }, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    })
  } catch (e) {
    return serverError(e)
  }
}
