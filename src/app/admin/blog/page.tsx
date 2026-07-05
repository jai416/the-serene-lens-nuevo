"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper, ArrowLeft, Plus, Trash2, ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"

interface BlogPost {
  id: string
  title: string
  slug: string
  category: string
  published: boolean
  views: number
  createdAt: string
}

export default function AdminBlogPage() {
  const { data: session, status } = useSession()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", category: "", image: "", published: false })

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/admin/blog")
        .then((r) => r.ok ? r.json() : { data: { posts: [] } })
        .then((d) => setPosts(d?.data?.posts || d.posts || []))
        .catch(() => toast.error("Error al cargar artículos"))
    }
  }, [session])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><ListSkeleton rows={5} /></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const resetForm = () => setForm({ title: "", slug: "", excerpt: "", content: "", category: "", image: "", published: false })

  const createPost = async () => {
    if (!form.title || !form.slug) return
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug: form.slug.toLowerCase().replace(/\s+/g, "-") }),
      })
      if (res.ok) {
        const data = await res.json()
        const post = data?.data?.post || data.post
        setPosts([post, ...posts])
        resetForm()
        toast.success("Artículo creado correctamente")
      } else {
        const data = await res.json()
        toast.error(data.error?.message || data.error || "Error al crear artículo")
      }
    } catch {
      toast.error("Error al crear artículo")
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return
    try {
      const res = await fetch("/api/admin/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== id))
        toast.success("Artículo eliminado")
      } else {
        const data = await res.json()
        toast.error(data.error?.message || data.error || "Error al eliminar artículo")
      }
    } catch {
      toast.error("Error al eliminar artículo")
    }
  }

  const togglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch("/api/admin/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, published: !post.published }),
      })
      if (res.ok) {
        setPosts(posts.map((p) => (p.id === post.id ? { ...p, published: !p.published } : p)))
      } else {
        toast.error("Error al cambiar estado")
      }
    } catch {
      toast.error("Error al cambiar estado")
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF5] dark:bg-[#1A1F19] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#64705E] dark:text-[#9BAA93] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6] inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="w-3 h-3" /> Volver al panel
          </Link>
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <Newspaper className="w-3.5 h-3.5 mr-2" />
            Blog
          </Badge>
          <h1 className="font-serif text-3xl font-semibold">
            Administrar <span className="gradient-text">Blog</span>
          </h1>
        </div>

        {/* New Post Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Nuevo Artículo
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <input
                placeholder="Título"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                placeholder="Slug (url-del-articulo)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <input
                placeholder="Categoría"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                placeholder="URL de imagen"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <textarea
              placeholder="Extracto (breve descripción)"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4 min-h-[60px] resize-none"
            />
            <textarea
              placeholder="Contenido (HTML)"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4 min-h-[150px] resize-none font-mono"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="rounded"
                />
                Publicar inmediatamente
              </label>
              <Button onClick={createPost} className="rounded-full ml-auto" disabled={!form.title || !form.slug}>
                <Plus className="w-4 h-4 mr-1.5" />
                Crear Artículo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="space-y-2">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${post.published ? "bg-green-500" : "bg-amber-500"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">
                      {post.category} · {post.views} vistas · {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Button variant="ghost" size="sm"><ExternalLink className="w-3.5 h-3.5" /></Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => togglePublish(post)}>
                    {post.published ? "Ocultar" : "Publicar"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && (
            <p className="text-center text-[#64705E] dark:text-[#9BAA93] py-10">No hay artículos aún</p>
          )}
        </div>
      </div>
    </div>
  )
}
