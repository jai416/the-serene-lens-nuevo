"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Newspaper, ArrowRight, Clock, Eye } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  image: string
  category: string
  readTime: number | null
  views: number
  publishedAt: string | null
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      try {
        const url = category ? `/api/blog?limit=50&category=${category}` : "/api/blog?limit=50"
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setPosts(data?.data?.posts || data.posts || [])
        }
      } catch {
        toast.error("Error al cargar artículos")
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [category])

  const categories = posts.reduce<string[]>((acc, p) => {
    if (!acc.includes(p.category)) acc.push(p.category)
    return acc
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <Newspaper className="w-3.5 h-3.5 mr-2" />
            Blog
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2">
            Últimos <span className="gradient-text">Artículos</span>
          </h1>
          <p className="text-muted-foreground">
            Tips, ciencia y tendencias en cuidado de la piel.
          </p>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 justify-center mb-8 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setCategory("")}
              className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                !category ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  category === cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Cargando artículos...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No hay artículos publicados aún.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full group overflow-hidden">
                  <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    <Image
                      src={post.image || "/images/placeholder.svg"}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge className="absolute top-3 left-3 bg-background/90 text-foreground text-xs backdrop-blur-sm border-0">
                      {post.category}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {post.readTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime} min
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views}
                      </span>
                    </div>
                    <h2 className="font-serif text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
