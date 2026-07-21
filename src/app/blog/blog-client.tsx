"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Newspaper, Clock, Eye, Search } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"

export interface BlogPost {
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

interface Props {
  initialPosts: BlogPost[]
  initialTotalPages: number
}

export default function BlogClient({ initialPosts, initialTotalPages }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const POSTS_PER_PAGE = 9
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (initialPosts.length > 0 && page === 1 && !category) return

    const controller = new AbortController()
    const fetchPosts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: page.toString(), limit: POSTS_PER_PAGE.toString() })
        if (category) params.set("category", category)
        const res = await fetch(`/api/blog?${params}`, { signal: controller.signal })
        if (res.ok) {
          const data = await res.json()
          setPosts(data?.data?.posts || data.posts || [])
          setTotalPages(data?.data?.totalPages || Math.ceil((data?.data?.total || data.total || 0) / POSTS_PER_PAGE) || 1)
        }
      } catch {
        if (!controller.signal.aborted) toast.error("Error al cargar artículos")
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
    return () => controller.abort()
  }, [category, page, initialPosts.length])

  const categories = posts.reduce<string[]>((acc, p) => {
    if (!acc.includes(p.category)) acc.push(p.category)
    return acc
  }, [])

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q)
    )
  })

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
          <p className="text-[#666666]">
            Tips, ciencia y tendencias en cuidado de la piel.
          </p>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 justify-center mb-8 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setCategory("")}
              className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                !category ? "bg-[#88B078] text-[#1A1A1A]" : "bg-[#E2ECE0] hover:bg-[#D4E6D0]"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  category === cat ? "bg-[#88B078] text-[#1A1A1A]" : "bg-[#E2ECE0] hover:bg-[#D4E6D0]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            aria-label="Buscar artículos"
            placeholder="Buscar artículos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-[#E8E8E8] bg-white text-[#1A1A1A] placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#88B078] transition-colors"
          />
        </div>

        {loading ? (
          <ListSkeleton rows={6} />
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#666666]">No hay artículos publicados aún.</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#666666]">No se encontraron artículos para &quot;{searchQuery}&quot;.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full group overflow-hidden">
                  <div className="relative aspect-[16/10] bg-[#E8E8E8] overflow-hidden">
                    <Image
                      src={post.image || "/images/placeholder.svg"}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge className="absolute top-3 left-3 bg-white/90 text-[#1A1A1A] text-xs backdrop-blur-sm border-0">
                      {post.category}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 text-xs text-[#666666] mb-3">
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
                    <h2 className="font-serif text-lg font-semibold mb-2 group-hover:text-[#88B078] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-[#666666] line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-full border border-[#E8E8E8] text-[#666666] hover:bg-[#E2ECE0] disabled:opacity-40 transition-colors"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                  page === p
                    ? "bg-[#88B078] text-[#1A1A1A]"
                    : "border border-[#E8E8E8] text-[#666666] hover:bg-[#E2ECE0]"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm rounded-full border border-[#E8E8E8] text-[#666666] hover:bg-[#E2ECE0] disabled:opacity-40 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}