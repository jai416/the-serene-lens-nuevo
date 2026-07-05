"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, ChevronDown, ChevronUp, Users, Plus } from "lucide-react";
import CommunityGuideBanner from "@/components/community-guide-banner";
import { logger } from "@/lib/logger";
import { ListSkeleton } from "@/components/ui/skeleton";

interface User {
  name: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface Reaction {
  type: string;
  count: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  createdAt: string;
  user: User;
  userId?: string;
  _count?: { comments: number };
  reactions?: Reaction[];
  group?: { name: string; slug: string } | null;
  communityGroupId?: string | null;
}

interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  _count: { members: number };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const categories = [
  { id: "all", label: "Todos" },
  { id: "general", label: "General" },
  { id: "rutinas", label: "Rutinas" },
  { id: "ingredientes", label: "Ingredientes" },
  { id: "consejos", label: "Consejos" },
];

const REACTION_TYPES = [
  { type: "LIKE", emoji: "\uD83D\uDC4D", label: "Like" },
  { type: "LOVE", emoji: "\u2764\uFE0F", label: "Love" },
  { type: "HELPFUL", emoji: "\uD83D\uDCA1", label: "Helpful" },
  { type: "INSIGHTFUL", emoji: "\uD83D\uDD0D", label: "Insightful" },
  { type: "INTERESTING", emoji: "\uD83C\uDFAF", label: "Interesting" },
];

export default function CommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });
  const [submitting, setSubmitting] = useState(false);

  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"feed" | "myGroups">("feed");
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [reactingPosts, setReactingPosts] = useState<Set<string>>(new Set());

  const fetchPosts = async (page: number, category: string, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (category !== "all") params.set("category", category);
      const res = await fetch(`/api/community/posts?${params}`, { signal });
      const data = await res.json();
      setPosts(Array.isArray(data.data?.posts) ? data.data.posts : []);
      setPagination(data.data.pagination);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      logger.error("Error fetching posts:", { error });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    setGroupsLoading(true);
    try {
      const res = await fetch("/api/community/groups");
      const data = await res.json();
      setGroups(data.data?.groups ?? data.groups ?? []);
    } catch (error) {
      logger.error("Error fetching groups:", { error });
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(currentPage, activeCategory, controller.signal);
    return () => controller.abort();
  }, [currentPage, activeCategory]);

  useEffect(() => {
    if (activeTab === "myGroups") {
      fetchGroups();
    }
  }, [activeTab]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        setShowNewPost(false);
        setNewPost({ title: "", content: "", category: "general" });
        fetchPosts(currentPage, activeCategory);
      }
    } catch (error) {
      logger.error("Error creating post:", { error });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupSubmitting(true);
    try {
      const res = await fetch("/api/community/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });
      if (res.ok) {
        setShowNewGroup(false);
        setNewGroup({ name: "", description: "" });
        fetchGroups();
      }
    } catch (error) {
      logger.error("Error creating group:", { error });
    } finally {
      setGroupSubmitting(false);
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!comments[postId]) {
      try {
        const res = await fetch(`/api/community/posts/${postId}/comments`);
        const data = await res.json();
        setComments((prev) => ({ ...prev, [postId]: data.data || [] }));
      } catch {
        setComments((prev) => ({ ...prev, [postId]: [] }));
      }
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    setCommentLoading(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        const newComment = data.data;
        setComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment],
        }));
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, _count: { comments: (p._count?.comments || 0) + 1 } }
              : p
          )
        );
      }
    } catch {
      logger.error("Error posting comment");
    } finally {
      setCommentLoading(null);
    }
  };

  const handleReact = async (postId: string, type: string) => {
    if (!session) return;
    const key = `${postId}-${type}`;
    if (reactingPosts.has(key)) return;
    setReactingPosts((prev) => new Set(prev).add(key));
    try {
      const res = await fetch(`/api/community/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        const count = data.data?.count ?? data.count;
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const existing = p.reactions ? [...p.reactions] : [];
            const idx = existing.findIndex((r) => r.type === type);
            if (idx >= 0) {
              existing[idx] = { ...existing[idx], count };
            } else {
              existing.push({ type, count: count ?? 1 });
            }
            return { ...p, reactions: existing };
          })
        );
      }
    } catch {
      logger.error("Error reacting to post");
    } finally {
      setReactingPosts((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const getReactionCount = (post: Post, type: string): number => {
    if (!post.reactions) return 0;
    const found = post.reactions.find((r) => r.type === type);
    return found?.count ?? 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-[#F8FAF5] dark:bg-[#1F1A17]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#2F3A2D] dark:text-[#F5EDE4]">Comunidad</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewGroup(true)}
              className="px-4 py-2 rounded-lg font-medium text-[#2F3A2D] bg-[#C2E09D] hover:bg-[#DDC8B5] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Comunidad
            </button>
            <button
              onClick={() => setShowNewPost(true)}
              className="px-4 py-2 rounded-lg font-medium text-[#2F3A2D] bg-[#C2E09D] hover:bg-[#DDC8B5] transition-colors"
            >
              Nueva Publicación
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "feed"
                ? "bg-[#C2E09D] text-[#2F3A2D]"
                : "bg-[#DDE7D3] text-[#64705E]"
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab("myGroups")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              activeTab === "myGroups"
                ? "bg-[#C2E09D] text-[#2F3A2D]"
                : "bg-[#DDE7D3] text-[#64705E]"
            }`}
          >
            <Users className="w-4 h-4" />
            Mis Comunidades
          </button>
        </div>

        {activeTab === "feed" && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeCategory === cat.id
                      ? "bg-[#C2E09D] text-[#2F3A2D]"
                      : "bg-[#DDE7D3] text-[#64705E]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {loading ? (
              <ListSkeleton rows={5} />
            ) : posts.length === 0 ? (
              <Card className="bg-white dark:bg-[#2A231E] border-[#DDE7D3] dark:border-[#2F3A2D]">
                <CardContent className="py-12 text-center">
                  <p className="text-[#64705E] dark:text-[#A09080]">No hay publicaciones todavía. Sé el primero en compartir.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="bg-white dark:bg-[#2A231E] border-[#DDE7D3] dark:border-[#2F3A2D]">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-[#2F3A2D] dark:text-[#F5EDE4]">{post.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {post.group && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-[#C2E09D] text-[#2F3A2D]">
                              {post.group.name}
                            </span>
                          )}
                          <span className="px-2 py-1 rounded text-xs font-medium bg-[#DDE7D3] dark:bg-[#352E26] text-[#64705E] dark:text-[#A09080]">
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-[#64705E] dark:text-[#A09080] line-clamp-2">{post.content}</p>
                      <CommunityGuideBanner content={post.content} />
                      <div className="flex justify-between items-center text-sm text-[#64705E] dark:text-[#A09080]">
                        <div className="flex items-center gap-4">
                          <span>{post.user.name || "Anónimo"}</span>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleComments(post.id)}
                            className="flex items-center gap-1 hover:text-[#2F3A2D] dark:hover:text-[#F5EDE4] transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post._count?.comments || 0}</span>
                            {expandedPost === post.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[#DDE7D3] dark:border-[#2F3A2D]">
                        {REACTION_TYPES.map((rt) => {
                          const count = getReactionCount(post, rt.type);
                          const key = `${post.id}-${rt.type}`;
                          const isReacting = reactingPosts.has(key);
                          return (
                            <button
                              key={rt.type}
                              onClick={() => handleReact(post.id, rt.type)}
                              disabled={!session || isReacting}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors hover:bg-[#DDE7D3] dark:hover:bg-[#352E26] disabled:opacity-50"
                            >
                              <span>{rt.emoji}</span>
                              <span className="text-[#64705E] dark:text-[#A09080]">{count}</span>
                            </button>
                          );
                        })}
                      </div>

                      {expandedPost === post.id && (
                        <div className="mt-4 pt-4 border-t border-[#DDE7D3] dark:border-[#2F3A2D]">
                          <div className="space-y-3 mb-4">
                            {(comments[post.id] || []).length === 0 && (
                              <p className="text-sm text-[#64705E] dark:text-[#A09080]">No hay comentarios aún.</p>
                            )}
                            {(comments[post.id] || []).map((c) => (
                              <div key={c.id} className="bg-[#F8FAF5] dark:bg-[#231D18] rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-[#2F3A2D] dark:text-[#F5EDE4]">
                                    {c.user?.name || "Anónimo"}
                                  </span>
                                  <span className="text-[10px] text-[#64705E] dark:text-[#A09080]">
                                    {formatDate(c.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-[#64705E] dark:text-[#A09080]">{c.content}</p>
                              </div>
                            ))}
                          </div>

                          {session ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                aria-label="Escribe un comentario"
                                value={commentText[post.id] || ""}
                                onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                                placeholder="Escribe un comentario..."
                                className="flex-1 px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2F3A2D] bg-white dark:bg-[#302923] text-sm text-[#2F3A2D] dark:text-[#F5EDE4] placeholder:text-[#64705E] dark:placeholder:text-[#7A6A5A] focus:outline-none focus:border-[#C2E09D]"
                              />
                              <button
                                onClick={() => submitComment(post.id)}
                                disabled={commentLoading === post.id || !commentText[post.id]?.trim()}
                                className="px-3 py-2 bg-[#C2E09D] text-[#2F3A2D] rounded-lg hover:bg-[#DDC8B5] transition-colors disabled:opacity-50"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-[#64705E] dark:text-[#A09080]">Inicia sesión para comentar.</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-[#C2E09D] text-[#2F3A2D]"
                        : "bg-[#DDE7D3] dark:bg-[#352E26] text-[#64705E] dark:text-[#A09080]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "myGroups" && (
          <>
            {groupsLoading ? (
              <ListSkeleton rows={3} />
            ) : groups.length === 0 ? (
              <Card className="bg-white dark:bg-[#2A231E] border-[#DDE7D3] dark:border-[#2F3A2D]">
                <CardContent className="py-12 text-center">
                  <p className="text-[#64705E] dark:text-[#A09080]">No tienes comunidades aún. ¡Crea la primera!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <Card key={group.id} className="bg-white dark:bg-[#2A231E] border-[#DDE7D3] dark:border-[#2F3A2D]">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#2F3A2D] dark:text-[#F5EDE4]">{group.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-[#64705E] dark:text-[#A09080] mb-3">{group.description}</p>
                      <div className="flex items-center gap-4 text-sm text-[#64705E] dark:text-[#A09080]">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {group._count?.members ?? 0} miembros
                        </span>
                        <span>Creada el {formatDate(group.createdAt)}</span>
                      </div>
                      <a
                        href={`/community/groups/${group.slug}`}
                        className="inline-block mt-3 text-sm font-medium text-[#2F3A2D] dark:text-[#F5EDE4] hover:underline"
                      >
                        Ver publicaciones &rarr;
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {showNewPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewPost(false)}>
            <Card className="w-full max-w-lg bg-white dark:bg-[#2A231E]" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-[#2F3A2D] dark:text-[#F5EDE4]">Nueva Publicación</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#F5EDE4]">Título</label>
                    <input
                      type="text"
                      aria-label="Título del post"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2F3A2D] bg-[#F8FAF5] dark:bg-[#231D18] text-[#2F3A2D] dark:text-[#F5EDE4]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#F5EDE4]">Categoría</label>
                    <select
                      aria-label="Categoría"
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2F3A2D] bg-[#F8FAF5] dark:bg-[#231D18] text-[#2F3A2D] dark:text-[#F5EDE4]"
                    >
                      <option value="general">General</option>
                      <option value="rutinas">Rutinas</option>
                      <option value="ingredientes">Ingredientes</option>
                      <option value="consejos">Consejos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#F5EDE4]">Contenido</label>
                    <textarea
                      aria-label="Contenido del post"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2F3A2D] bg-[#F8FAF5] dark:bg-[#231D18] h-32 resize-none text-[#2F3A2D] dark:text-[#F5EDE4]"
                      required
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowNewPost(false)} className="px-4 py-2 rounded-lg font-medium text-[#64705E] dark:text-[#A09080]">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg font-medium text-[#2F3A2D] bg-[#C2E09D] hover:bg-[#DDC8B5] disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "Publicando..." : "Publicar"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {showNewGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewGroup(false)}>
            <Card className="w-full max-w-lg bg-white dark:bg-[#2A231E]" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-[#2F3A2D] dark:text-[#F5EDE4]">Nueva Comunidad</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitGroup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#F5EDE4]">Nombre</label>
                    <input
                      type="text"
                      aria-label="Nombre de la comunidad"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2F3A2D] bg-[#F8FAF5] dark:bg-[#231D18] text-[#2F3A2D] dark:text-[#F5EDE4]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#F5EDE4]">Descripción</label>
                    <textarea
                      aria-label="Descripción de la comunidad"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2F3A2D] bg-[#F8FAF5] dark:bg-[#231D18] h-24 resize-none text-[#2F3A2D] dark:text-[#F5EDE4]"
                      required
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowNewGroup(false)} className="px-4 py-2 rounded-lg font-medium text-[#64705E] dark:text-[#A09080]">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={groupSubmitting}
                      className="px-4 py-2 rounded-lg font-medium text-[#2F3A2D] bg-[#C2E09D] hover:bg-[#DDC8B5] disabled:opacity-50 transition-colors"
                    >
                      {groupSubmitting ? "Creando..." : "Crear Comunidad"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
