"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users, MessageSquare, Heart, Send, Plus, ChevronRight,
  Sparkles, Loader2, ThumbsUp, MessageCircle, LogIn,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { ListSkeleton } from "@/components/ui/skeleton"

interface CommunityGroup {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  _count: { members: number; posts: number }
  isRecommended: boolean
}

interface PostUser {
  id: string
  name: string | null
  image: string | null
  plan: string | null
}

interface Post {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
  user: PostUser
  groupId: string | null
  _count: { comments: number; reactions: number }
}

const SKIN_TYPE_GROUPS = [
  { name: "Piel Grasa", slug: "grasa", description: "Tips, productos y rutinas para controlar el brillo y los poros" },
  { name: "Piel Seca", slug: "seca", description: "Hidratación profunda y nutrición para pieles secas" },
  { name: "Piel Mixta", slug: "mixta", description: "El equilibrio perfecto entre zona T grasa y mejillas secas" },
  { name: "Piel Sensible", slug: "sensible", description: "Cuidado suave para pieles que reaccionan fácilmente" },
  { name: "Piel Normal", slug: "normal", description: "Mantenimiento y prevención para piel equilibrada" },
  { name: "General", slug: "general", description: "Conversaciones generales sobre cuidado facial" },
]

export default function CommunityPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [postTitle, setPostTitle] = useState("")
  const [postContent, setPostContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [userSkinType, setUserSkinType] = useState<string>("")

  useEffect(() => {
    if (!session) { setLoading(false); return }
    const fetchData = async () => {
      try {
        const res = await fetch("/api/community/groups")
        const data = await res.json()
        const allGroups = data?.data?.groups || data?.groups || []
        setGroups(allGroups)

        const recommended = allGroups.find((g: CommunityGroup) => g.isRecommended)
        if (recommended) setUserSkinType(recommended.slug)

        // Auto-select recommended group
        if (!selectedGroup) {
          const first = allGroups.find((g: CommunityGroup) => g.isRecommended) || allGroups[0]
          if (first) setSelectedGroup(first.id)
        }
      } catch {}
    }
    fetchData()
  }, [session])

  useEffect(() => {
    if (!selectedGroup) return
    fetch(`/api/community/posts?groupId=${selectedGroup}`)
      .then((res) => res.ok ? res.json() : { data: { posts: [] } })
      .then((data) => {
        const raw = data?.data?.posts || data?.posts || []
        setPosts(Array.isArray(raw) ? raw : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedGroup])

  const submitPost = async () => {
    if (!postTitle.trim() || !postContent.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle,
          content: postContent,
          groupId: selectedGroup,
          category: "general",
        }),
      })
      if (res.ok) {
        setNewPostOpen(false)
        setPostTitle("")
        setPostContent("")
        // Refresh
        const postsRes = await fetch(`/api/community/posts?groupId=${selectedGroup}`)
        const data = await postsRes.json()
        setPosts(data?.data?.posts || data?.posts || [])
      }
    } catch {}
    setSubmitting(false)
  }

  const joinGroup = async (groupId: string) => {
    const res = await fetch(`/api/community/groups/${groupId}`, { method: "POST" })
    if (res.ok) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, _count: { ...g._count, members: g._count.members + 1 } } : g
        )
      )
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#E2ECE0] flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-[#1A1A1A]" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1A1A1A] mb-3">Comunidad</h1>
          <p className="text-[#666666] mb-6">Inicia sesión para conectar con otros usuarios.</p>
          <Link href="/login">
            <Button><LogIn className="w-4 h-4 mr-2" /> Iniciar sesión</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Users className="w-3.5 h-3.5 mr-2" />
            Comunidad
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
            Comunidad
          </h1>
          <p className="text-sm text-[#666666] mt-2">
            Conecta con personas de tu mismo tipo de piel, comparte experiencias y aprende juntos.
          </p>
        </div>

        {/* Groups / Skin Type Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#88B078]" />
            <span className="text-sm font-medium text-[#1A1A1A]">
              {userSkinType ? `Grupo recomendado para ti: ${userSkinType}` : "Grupos"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKIN_TYPE_GROUPS.map((g) => {
              const isSelected = groups.find((gr) => gr.id === selectedGroup)?.slug === g.slug
              const isRecommended = userSkinType && g.slug === userSkinType.toLowerCase()
              return (
                <button
                  key={g.slug}
                  onClick={() => {
                    const group = groups.find((gr) => gr.slug === g.slug)
                    if (group) setSelectedGroup(group.id)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    isSelected
                      ? "bg-[#88B078] text-white border-[#88B078]"
                      : isRecommended
                      ? "bg-[#FFF9E6] text-[#1A1A1A] border-[#FCEAA6]"
                      : "bg-white text-[#666666] border-[#E8E8E8] hover:bg-[#F8F9FA]"
                  }`}
                >
                  {g.name}
                  {isRecommended && !isSelected && " ★"}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar: group info */}
          <div className="lg:col-span-1 space-y-4">
            {selectedGroup && (() => {
              const dbGroup = groups.find((g) => g.id === selectedGroup)
              const skinGroup = SKIN_TYPE_GROUPS.find((g) => dbGroup?.slug === g.slug)
              return (
                <Card className="p-4">
                  <CardContent className="p-0">
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">{dbGroup?.name || skinGroup?.name || "Grupo"}</h3>
                    <p className="text-xs text-[#666666] mb-4">{dbGroup?.description || skinGroup?.description || ""}</p>
                    <div className="flex items-center gap-4 text-xs text-[#666666]">
                      <span>👥 {(dbGroup as any)?._count?.members || 0} miembros</span>
                      <span>📝 {(dbGroup as any)?._count?.posts || 0} posts</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => {
                        const group = groups.find((g) => g.id === selectedGroup)
                        if (group) joinGroup(group.id)
                      }}
                    >
                      Unirse al grupo
                    </Button>
                  </CardContent>
                </Card>
              )
            })()}
          </div>

          {/* Posts */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Publicaciones</h2>
              <Button size="sm" onClick={() => setNewPostOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Nuevo Post
              </Button>
            </div>

            {/* New Post Form */}
            {newPostOpen && (
              <Card className="p-4 border-[#88B078]">
                <CardContent className="p-0 space-y-3">
                  <Input
                    placeholder="Título"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="text-sm"
                  />
                  <textarea
                    placeholder="Comparte tu experiencia, rutina o pregunta..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={4}
                    className="flex w-full rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-[#999] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#88B078] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setNewPostOpen(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={submitPost} disabled={submitting || !postTitle || !postContent}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                      Publicar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <ListSkeleton rows={5} />
            ) : posts.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent className="p-0">
                  <MessageSquare className="w-10 h-10 text-[#9BAA93] mx-auto mb-3" />
                  <p className="text-sm text-[#666666]">Aún no hay publicaciones en este grupo.</p>
                  <p className="text-xs text-[#999] mt-1">¡Sé el primero en compartir!</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="p-4 transition-all duration-200 hover:shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#E2ECE0] flex items-center justify-center text-xs font-medium text-[#1A1A1A]">
                        {post.user.name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A] leading-tight">
                          {post.user.name || "Anónimo"}
                        </p>
                        <p className="text-[10px] text-[#999]">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-1">{post.title}</h3>
                    <p className="text-sm text-[#666666] whitespace-pre-line line-clamp-3">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-[#999]">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> {post._count.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> {post._count.reactions}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
