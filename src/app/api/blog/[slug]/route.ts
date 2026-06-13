import { db } from "@/lib/db"
import { ok, notFound, serverError } from "@/lib/api-response"

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

    return ok({ post })
  } catch (e) {
    return serverError(e)
  }
}
