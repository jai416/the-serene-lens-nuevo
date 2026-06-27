"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, ChevronDown, ChevronUp, Heart } from "lucide-react";
import CommunityGuideBanner from "@/components/community-guide-banner";

interface User {
  name: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
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
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const fetchPosts = async (page: number, category: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (category !== "all") params.set("category", category);
      const res = await fetch(`/api/community/posts?${params}`);
      const data = await res.json();
      setPosts(data.data.posts);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(currentPage, activeCategory);
  }, [currentPage, activeCategory]);

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
      console.error("Error creating post:", error);
    } finally {
      setSubmitting(false);
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
      console.error("Error posting comment");
    } finally {
      setCommentLoading(null);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session || likedPosts[postId]) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        setLikedPosts((prev) => ({ ...prev, [postId]: true }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
        );
      }
    } catch {}
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-[#F8FAF5] dark:bg-[#1A1F19]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#2F3A2D] dark:text-[#E8EDE6]">Comunidad</h1>
          <button
            onClick={() => setShowNewPost(true)}
            className="px-4 py-2 rounded-lg font-medium text-[#2F3A2D] bg-[#C2E09D] hover:bg-[#B0D48E] transition-colors"
          >
            Nueva Publicación
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-[#C2E09D] text-[#2F3A2D]"
                  : "bg-[#E8EDE4] dark:bg-[#2E3829] text-[#64705E] dark:text-[#9BAA93]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#64705E]">Cargando publicaciones...</div>
        ) : posts.length === 0 ? (
          <Card className="bg-white dark:bg-[#222920] border-[#E8EDE4] dark:border-[#3A4536]">
            <CardContent className="py-12 text-center">
              <p className="text-[#64705E] dark:text-[#9BAA93]">No hay publicaciones todavía. Sé el primero en compartir.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="bg-white dark:bg-[#222920] border-[#E8EDE4] dark:border-[#3A4536]">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-[#2F3A2D] dark:text-[#E8EDE6]">{post.title}</CardTitle>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-[#E8EDE4] dark:bg-[#2E3829] text-[#64705E] dark:text-[#9BAA93]">
                      {post.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-[#64705E] dark:text-[#9BAA93] line-clamp-2">{post.content}</p>
                  <CommunityGuideBanner content={post.content} />
                  <div className="flex justify-between items-center text-sm text-[#64705E] dark:text-[#9BAA93]">
                    <div className="flex items-center gap-4">
                      <span>{post.user.name || "Anónimo"}</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(post.id)}
                        disabled={!session || likedPosts[post.id] || post.userId === session?.user?.id}
                        className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
                          likedPosts[post.id] ? "text-[#E07070]" : "hover:text-[#E07070]"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${likedPosts[post.id] ? "fill-current" : ""}`} />
                        <span>{post.likes}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1 hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6] transition-colors"
                      >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post._count?.comments || 0}</span>
                      {expandedPost === post.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    </div>
                  </div>

                  {expandedPost === post.id && (
                    <div className="mt-4 pt-4 border-t border-[#E8EDE4] dark:border-[#3A4536]">
                      <div className="space-y-3 mb-4">
                        {(comments[post.id] || []).length === 0 && (
                          <p className="text-sm text-[#8A9A82] dark:text-[#7A8A72]">No hay comentarios aún.</p>
                        )}
                        {(comments[post.id] || []).map((c) => (
                          <div key={c.id} className="bg-[#F8FAF5] dark:bg-[#1E251C] rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">
                                {c.user?.name || "Anónimo"}
                              </span>
                              <span className="text-[10px] text-[#8A9A82] dark:text-[#7A8A72]">
                                {formatDate(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-[#64705E] dark:text-[#9BAA93]">{c.content}</p>
                          </div>
                        ))}
                      </div>

                      {session ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentText[post.id] || ""}
                            onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                            placeholder="Escribe un comentario..."
                            className="flex-1 px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#3A4536] bg-white dark:bg-[#2A3228] text-sm text-[#2F3A2D] dark:text-[#E8EDE6] placeholder:text-[#8A9A82] dark:placeholder:text-[#7A8A72] focus:outline-none focus:border-[#C2E09D]"
                          />
                          <button
                            onClick={() => submitComment(post.id)}
                            disabled={commentLoading === post.id || !commentText[post.id]?.trim()}
                            className="px-3 py-2 bg-[#C2E09D] text-[#2F3A2D] rounded-lg hover:bg-[#B0D48E] transition-colors disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-[#8A9A82] dark:text-[#7A8A72]">Inicia sesión para comentar.</p>
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
                    : "bg-[#E8EDE4] dark:bg-[#2E3829] text-[#64705E] dark:text-[#9BAA93]"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        {showNewPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewPost(false)}>
            <Card className="w-full max-w-lg bg-white dark:bg-[#222920]" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-[#2F3A2D] dark:text-[#E8EDE6]">Nueva Publicación</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Título</label>
                    <input
                      type="text"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#3A4536] bg-[#F8FAF5] dark:bg-[#1E251C] text-[#2F3A2D] dark:text-[#E8EDE6]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Categoría</label>
                    <select
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#3A4536] bg-[#F8FAF5] dark:bg-[#1E251C] text-[#2F3A2D] dark:text-[#E8EDE6]"
                    >
                      <option value="general">General</option>
                      <option value="rutinas">Rutinas</option>
                      <option value="ingredientes">Ingredientes</option>
                      <option value="consejos">Consejos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Contenido</label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#3A4536] bg-[#F8FAF5] dark:bg-[#1E251C] h-32 resize-none text-[#2F3A2D] dark:text-[#E8EDE6]"
                      required
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowNewPost(false)} className="px-4 py-2 rounded-lg font-medium text-[#64705E] dark:text-[#9BAA93]">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg font-medium text-[#2F3A2D] bg-[#C2E09D] hover:bg-[#B0D48E] disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "Publicando..." : "Publicar"}
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
