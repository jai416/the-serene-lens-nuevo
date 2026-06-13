import type { MetadataRoute } from "next"
import { db } from "@/lib/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://theserenelens.com"

  const staticPages = [
    { path: "", priority: 1.0 },
    { path: "/analysis", priority: 0.9 },
    { path: "/products", priority: 0.8 },
    { path: "/blog", priority: 0.9 },
    { path: "/pricing", priority: 0.8 },
    { path: "/contact", priority: 0.7 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ]

  let blogEntries: MetadataRoute.Sitemap = []
  let productEntries: MetadataRoute.Sitemap = []

  try {
    const blogPosts = await db.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
    blogEntries = blogPosts.map((post) => ({
      url: `${url}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      priority: 0.7 as const,
    }))
  } catch {}

  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })
    productEntries = products.map((product) => ({
      url: `${url}/products/${product.slug}`,
      lastModified: product.updatedAt,
      priority: 0.6 as const,
    }))
  } catch {}

  return [
    ...staticPages.map((page) => ({
      url: `${url}${page.path}`,
      priority: page.priority,
    })),
    ...blogEntries,
    ...productEntries,
  ]
}
