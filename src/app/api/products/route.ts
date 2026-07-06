import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { serverError } from "@/lib/api-response"

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
        skinTypes: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    })

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
