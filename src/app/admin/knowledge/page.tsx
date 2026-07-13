"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, ArrowLeft, Plus, Trash2, RefreshCw } from "lucide-react"
import { getCsrfToken } from "@/lib/csrf-client"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"

interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: string
  subcategory: string | null
  source: string
  sourceUrl: string | null
  priority: number
  keywords: string[]
  synonyms: string[]
  enabled: boolean
  version: number
  helpfulCount: number
  unhelpfulCount: number
  createdAt: string
  updatedAt: string
}

export default function AdminKnowledgePage() {
  const { data: session, status } = useSession()
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [newEntry, setNewEntry] = useState({ title: "", content: "", category: "general", priority: 0 })

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/knowledge")
      if (res.ok) {
        const d = await res.json()
        setEntries(d?.data?.knowledge || d.knowledge || [])
      }
    } catch {
      toast.error("Error al cargar base de conocimiento")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") loadEntries()
  }, [session, loadEntries])

  if (status === "loading") return <div className="flex items-center justify-center py-20"><ListSkeleton rows={5} /></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/knowledge/sync", {
        method: "POST",
        headers: { "x-csrf-token": getCsrfToken() },
      })
      if (res.ok) {
        const d = await res.json()
        const data = d?.data || d
        toast.success(`Sincronizado: ${data.created} creados, ${data.updated} actualizados`)
        loadEntries()
      } else {
        toast.error("Error al sincronizar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSyncing(false)
    }
  }

  const handleCreate = async () => {
    if (!newEntry.title || !newEntry.content) return
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify(newEntry),
      })
      if (res.ok) {
        toast.success("Entrada creada")
        setNewEntry({ title: "", content: "", category: "general", priority: 0 })
        loadEntries()
      }
    } catch {
      toast.error("Error al crear entrada")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta entrada?")) return
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": getCsrfToken() },
      })
      if (res.ok) {
        toast.success("Entrada eliminada")
        setEntries(entries.filter((e) => e.id !== id))
      }
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const handleToggle = async (entry: KnowledgeEntry) => {
    try {
      const res = await fetch(`/api/admin/knowledge/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !entry.enabled }),
      })
      if (res.ok) {
        setEntries(entries.map((e) => (e.id === entry.id ? { ...e, enabled: !e.enabled } : e)))
        toast.success(entry.enabled ? "Desactivado" : "Activado")
      }
    } catch {
      toast.error("Error al actualizar")
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-[#666666] hover:text-[#1A1A1A] inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Volver al panel
        </Link>
        <Badge className="bg-[#E2ECE0] text-[#1A1A1A] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
          <BookOpen className="w-3 h-3 mr-1.5" />
          Base de Conocimiento
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-3">
          Conocimiento del <span className="text-[#88B078]">Bot</span>
        </h1>
        <p className="text-sm text-[#666666] mt-1">Gestiona la información que usa el bot de Telegram para responder</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <Button onClick={handleSync} disabled={syncing} className="bg-[#88B078] text-white hover:bg-[#6F9A5E]">
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar con la web"}
        </Button>
      </div>

      {/* Create new */}
      <Card className="mb-6 border border-[#E8E8E8]">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Nueva entrada</h3>
          <div className="grid gap-3">
            <input
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              placeholder="Título"
              className="px-4 py-2 rounded-lg text-sm border border-[#E8E8E8] bg-[#F8F9FA] text-[#1A1A1A]"
            />
            <textarea
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              placeholder="Contenido (markdown o texto)"
              rows={3}
              className="px-4 py-2 rounded-lg text-sm border border-[#E8E8E8] bg-[#F8F9FA] text-[#1A1A1A]"
            />
            <div className="flex gap-3">
              <select
                value={newEntry.category}
                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                className="px-4 py-2 rounded-lg text-sm border border-[#E8E8E8] bg-[#F8F9FA] text-[#1A1A1A]"
              >
                <option value="general">General</option>
                <option value="pricing">Precios</option>
                <option value="analysis">Análisis</option>
                <option value="blog">Blog</option>
                <option value="product">Productos</option>
                <option value="support">Soporte</option>
              </select>
              <input
                type="number"
                value={newEntry.priority}
                onChange={(e) => setNewEntry({ ...newEntry, priority: parseInt(e.target.value) || 0 })}
                placeholder="Prioridad (0-10)"
                className="w-24 px-4 py-2 rounded-lg text-sm border border-[#E8E8E8] bg-[#F8F9FA] text-[#1A1A1A]"
              />
            </div>
            <Button onClick={handleCreate} className="bg-[#88B078] text-white hover:bg-[#6F9A5E]">
              <Plus className="w-4 h-4 mr-2" />
              Crear entrada
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <ListSkeleton rows={5} />
      ) : entries.length === 0 ? (
        <Card className="border border-[#E8E8E8]">
          <CardContent className="p-8 text-center text-[#666666]">No hay entradas de conocimiento</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id} className="border border-[#E8E8E8]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${entry.enabled ? "bg-[#E2ECE0] text-[#88B078]" : "bg-[#FEF2F2] text-[#E07070]"}`}>
                        {entry.enabled ? "Activo" : "Inactivo"}
                      </span>
                      <Badge className="text-[10px] bg-[#F8F9FA] text-[#666666]">
                        {entry.category}{entry.subcategory ? ` / ${entry.subcategory}` : ""}
                      </Badge>
                      <span className="text-[10px] text-[#666666]">v{entry.version}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">{entry.title}</h3>
                    <p className="text-xs text-[#666666] mt-1 line-clamp-2">{entry.content.slice(0, 200)}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[#666666]">
                      <span>👍 {entry.helpfulCount}</span>
                      <span>👎 {entry.unhelpfulCount}</span>
                      <span>Prioridad: {entry.priority}</span>
                      {entry.sourceUrl && <span>URL: {entry.sourceUrl}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button onClick={() => handleToggle(entry)} className="p-1.5 rounded hover:bg-[#F0F0F0]" title={entry.enabled ? "Desactivar" : "Activar"}>
                      {entry.enabled ? "✅" : "⏸️"}
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded hover:bg-[#F0F0F0]" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5 text-[#E07070]" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
