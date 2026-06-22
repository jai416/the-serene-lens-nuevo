"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Newspaper, ArrowLeft, Clock, Eye, Calendar, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  image: string
  category: string
  tags: string | null
  readTime: number | null
  views: number
  publishedAt: string | null
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog/${slug}`)
        if (!res.ok) throw new Error("Not found")
        const data = await res.json()
        setPost(data.post)
      } catch {
        setPost(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando artículo...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-xl font-semibold mb-2">Artículo no encontrado</h2>
          <p className="text-muted-foreground text-sm mb-6">Este artículo no existe o ha sido eliminado.</p>
          <Link href="/blog">
            <Button className="rounded-full">
              <Newspaper className="w-4 h-4 mr-2" />
              Ver blog
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const jsonLd = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: "The Serene Lens" },
    publisher: { "@type": "Organization", name: "The Serene Lens", logo: { "@type": "ImageObject", url: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/icon.svg` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/blog/${post.slug}` },
  } : null

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <article className="max-w-3xl mx-auto">
        <nav className="flex items-center gap-2 text-xs text-[#64705E] mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#2F3A2D]">Inicio</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#2F3A2D]">Blog</Link>
          <span>/</span>
          <span className="text-[#2F3A2D] truncate max-w-[200px]">{post.title}</span>
        </nav>
        <Button variant="ghost" size="sm" onClick={() => router.push("/blog")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver al blog
        </Button>

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

        <div
          className="prose prose-sm sm:prose-base max-w-none dark:prose-invert
            prose-headings:font-serif prose-headings:font-semibold
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-sm"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <hr className="my-8 border-outline/30" />
        <p className="text-xs text-muted-foreground">
          ⚠️ Este contenido es informativo y no sustituye una consulta médica profesional.
        </p>
      </article>
    </div>
  )
}
