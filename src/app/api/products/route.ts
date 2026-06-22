import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, serverError } from "@/lib/api-response"
import { unstable_cache } from "next/cache"

const getCachedProducts = unstable_cache(
  async (category?: string | null, limit?: number) => {
    const where = category ? { category, isActive: true } : { isActive: true }
    return db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDesc: true,
        image: true,
        category: true,
        price: true,
        skinTypes: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    })
  },
  ["products-catalog"],
  { revalidate: 3600, tags: ["products-catalog"] }
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50)
    const category = searchParams.get("category")

    const products = await getCachedProducts(category, limit)

    return ok({ products })
  } catch (e) {
    return serverError(e)
  }
}
