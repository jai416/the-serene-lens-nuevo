import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Newspaper, ArrowLeft, Clock, Eye, Calendar } from "lucide-react"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await db.blogPost.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true, image: true, slug: true, publishedAt: true },
  })

  if (!post) return { title: "Artículo no encontrado" }

  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/blog/${post.slug}`

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url,
      publishedTime: post.publishedAt?.toISOString(),
      siteName: "The Serene Lens",
      locale: "es_ES",
      images: post.image ? [{ url: post.image, alt: post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.image ? [post.image] : [],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await db.blogPost.findUnique({
    where: { slug, published: true },
  })

  if (!post) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.image || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: "The Serene Lens",
    },
    publisher: {
      "@type": "Organization",
      name: "The Serene Lens",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`,
    },
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-3xl mx-auto">
        <nav
          className="flex items-center gap-2 text-xs text-[#64705E] mb-4"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-[#2F3A2D]">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#2F3A2D]">
            Blog
          </Link>
          <span>/</span>
          <span className="text-[#2F3A2D] truncate max-w-[200px]">
            {post.title}
          </span>
        </nav>

        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver al blog
          </Button>
        </Link>

        <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
          {post.category}
        </Badge>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </span>
          )}
          {post.readTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime} min de lectura
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.views} vistas
          </span>
        </div>

        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            className="w-full rounded-2xl shadow-sm mb-8 object-cover max-h-[400px]"
          />
        )}

        <div
          className="prose prose-sm sm:prose-base max-w-none
            prose-headings:font-serif prose-headings:font-semibold
            prose-a:text-[#C2E09D] prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-sm"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <hr className="my-8 border-[#DDE7D3]" />
        <p className="text-xs text-[#64705E]">
          Este contenido es informativo y no sustituye una consulta médica
          profesional.
        </p>
      </article>
    </div>
  )
}
