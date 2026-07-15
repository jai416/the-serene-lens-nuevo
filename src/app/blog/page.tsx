import { db } from "@/lib/db"
import type { Metadata } from "next"
import BlogClient from "./blog-client"
import type { BlogPost } from "./blog-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Blog de Skincare",
  description: "Artículos sobre cuidado de la piel, ingredientes activos, rutinas y tendencias en skincare.",
  openGraph: {
    title: "Blog de Skincare | The Serene Lens",
  },
}

export default async function BlogPage() {
  const POSTS_PER_PAGE = 9

  const where = { published: true }
  let posts: BlogPost[] = []
  let total = 0

  try {
    const [fetchedPosts, fetchedTotal] = await Promise.all([
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
        take: POSTS_PER_PAGE,
        orderBy: { publishedAt: "desc" },
      }),
      db.blogPost.count({ where }),
    ])
    posts = fetchedPosts.map((p) => ({
      ...p,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    }))
    total = fetchedTotal
  } catch {}

  const totalPages = Math.ceil(total / POSTS_PER_PAGE) || 1

  return (
    <BlogClient
      initialPosts={posts as BlogPost[]}
      initialTotalPages={totalPages}
    />
  )
}