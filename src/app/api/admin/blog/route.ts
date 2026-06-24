import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest } from "next/server"
import { revalidateTag } from "next/cache"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { adminBlogPostSchema, adminBlogUpdateSchema, adminDeleteSchema } from "@/lib/validations"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const posts = await db.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    })

    return ok({ posts })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const body = await req.json()
    const parsed = adminBlogPostSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const data = parsed.data
    const post = await db.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        image: data.image || "",
        category: data.category,
        tags: data.tags || null,
        published: data.published || false,
        publishedAt: data.published ? new Date() : null,
        readTime: data.readTime || null,
      },
    })

    revalidateTag("blog-posts", {})

    return ok({ post })
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const body = await req.json()
    const parsed = adminBlogUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const { id, ...data } = parsed.data
    const updateData: Record<string, unknown> = { ...data }
    if (data.published === true) {
      updateData.publishedAt = new Date()
    }

    const post = await db.blogPost.update({
      where: { id },
      data: updateData,
    })

    revalidateTag("blog-posts", {})

    return ok({ post })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const body = await req.json()
    const parsed = adminDeleteSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    await db.blogPost.delete({ where: { id: parsed.data.id } })

    revalidateTag("blog-posts", {})

    return ok({ deleted: true })
  } catch (e) {
    return serverError(e)
  }
}
