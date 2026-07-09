import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { serverError } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50)
    const page = Math.max(Number(searchParams.get("page")) || 1, 1)
    const category = searchParams.get("category")

    const where: any = { published: true }
    if (category) where.category = category

    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          image: true,
          category: true,
          readTime: true,
          views: true,
          publishedAt: true,
        },
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
      }),
      db.blogPost.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({ success: true, data: { posts, total, totalPages } }, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
      },
    })
  } catch (e) {
    return serverError(e)
  }
}
