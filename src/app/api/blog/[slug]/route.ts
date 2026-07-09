import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { notFound, serverError } from "@/lib/api-response"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    const post = await db.blogPost.findUnique({
      where: { slug, published: true },
    })

    if (!post) return notFound("Artículo no encontrado")

    await db.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({ success: true, data: { post } }, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
      },
    })
  } catch (e) {
    return serverError(e)
  }
}
