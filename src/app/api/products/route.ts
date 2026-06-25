import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, serverError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50)
    const category = searchParams.get("category")

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
        price: true,
        skinTypes: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    })

    return ok({ products })
  } catch (e) {
    return serverError(e)
  }
}
