"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  name: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  createdAt: string;
  user: User;
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "general",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async (page: number, category: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (category !== "all") {
        params.set("category", category);
      }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "#F8FAF5" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ color: "#2F3A2D" }}
          >
            Comunidad
          </h1>
          <button
            onClick={() => setShowNewPost(true)}
            className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
            style={{ backgroundColor: "#C2E09D" }}
          >
            Nueva Publicación
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                backgroundColor:
                  activeCategory === cat.id ? "#C2E09D" : "#E8EDE4",
                color: activeCategory === cat.id ? "#2F3A2D" : "#64705E",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12" style={{ color: "#64705E" }}>
            Cargando publicaciones...
          </div>
        ) : posts.length === 0 ? (
          <Card style={{ backgroundColor: "#FFFFFF", borderColor: "#E8EDE4" }}>
            <CardContent className="py-12 text-center">
              <p style={{ color: "#64705E" }}>
                No hay publicaciones todavía. Sé el primero en compartir.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card
                key={post.id}
                style={{ backgroundColor: "#FFFFFF", borderColor: "#E8EDE4" }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg" style={{ color: "#2F3A2D" }}>
                      {post.title}
                    </CardTitle>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: "#E8EDE4", color: "#64705E" }}
                    >
                      {post.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p
                    className="mb-4 line-clamp-2"
                    style={{ color: "#64705E" }}
                  >
                    {post.content}
                  </p>
                  <div
                    className="flex justify-between items-center text-sm"
                    style={{ color: "#64705E" }}
                  >
                    <div className="flex items-center gap-4">
                      <span>{post.user.name || "Anónimo"}</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <span>{post._count?.comments || 0} comentarios</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className="px-3 py-1 rounded text-sm font-medium transition-colors"
                  style={{
                    backgroundColor:
                      currentPage === page ? "#C2E09D" : "#E8EDE4",
                    color: currentPage === page ? "#2F3A2D" : "#64705E",
                  }}
                >
                  {page}
                </button>
              )
            )}
          </div>
        )}

        {showNewPost && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewPost(false)}
          >
            <Card
              className="w-full max-w-lg"
              style={{ backgroundColor: "#FFFFFF" }}
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle style={{ color: "#2F3A2D" }}>
                  Nueva Publicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#2F3A2D" }}
                    >
                      Título
                    </label>
                    <input
                      type="text"
                      value={newPost.title}
                      onChange={(e) =>
                        setNewPost({ ...newPost, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: "#E8EDE4",
                        backgroundColor: "#F8FAF5",
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#2F3A2D" }}
                    >
                      Categoría
                    </label>
                    <select
                      value={newPost.category}
                      onChange={(e) =>
                        setNewPost({ ...newPost, category: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: "#E8EDE4",
                        backgroundColor: "#F8FAF5",
                      }}
                    >
                      <option value="general">General</option>
                      <option value="rutinas">Rutinas</option>
                      <option value="ingredientes">Ingredientes</option>
                      <option value="consejos">Consejos</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#2F3A2D" }}
                    >
                      Contenido
                    </label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) =>
                        setNewPost({ ...newPost, content: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border h-32 resize-none"
                      style={{
                        borderColor: "#E8EDE4",
                        backgroundColor: "#F8FAF5",
                      }}
                      required
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowNewPost(false)}
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{ color: "#64705E" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: "#C2E09D" }}
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
