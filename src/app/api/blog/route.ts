import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, serverError } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50)
    const category = searchParams.get("category")

    const where: any = { published: true }
    if (category) where.category = category

    const posts = await db.blogPost.findMany({
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
      take: limit,
      orderBy: { publishedAt: "desc" },
    })

    return ok({ posts })
  } catch (e) {
    return serverError(e)
  }
}
