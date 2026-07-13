"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Plus, Eye, EyeOff, Trash2 } from "lucide-react"
import { formatDate, formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"

interface Guide {
  id: string
  title: string
  slug: string
  description: string
  shortDesc: string | null
  image: string
  category: string
  price: number
  fileUrl: string | null
  isActive: boolean
  createdAt: string
  _count: { purchases: number }
}

export default function AdminGuidesPage() {
  const { data: session, status } = useSession()
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    shortDesc: "",
    image: "",
    category: "skincare",
    price: 0,
    fileUrl: "",
  })

  const loadGuides = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guides")
      if (res.ok) {
        const d = await res.json()
        setGuides(d?.data?.guides || d.guides || [])
      }
    } catch {
      toast.error("Error al cargar guías")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") loadGuides()
  }, [session, loadGuides])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><ListSkeleton rows={4} /></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const createGuide = async () => {
    if (!form.title || !form.slug || !form.description || !form.image || form.price <= 0) {
      toast.error("Completa todos los campos requeridos")
      return
    }
    try {
      const res = await fetch("/api/admin/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          shortDesc: form.shortDesc || undefined,
          fileUrl: form.fileUrl || undefined,
          price: Number(form.price),
        }),
      })
      if (res.ok) {
        toast.success("Guía creada")
        setShowForm(false)
        setForm({ title: "", slug: "", description: "", shortDesc: "", image: "", category: "skincare", price: 0, fileUrl: "" })
        loadGuides()
      } else {
        const d = await res.json()
        toast.error(d.error || "Error al crear guía")
      }
    } catch {
      toast.error("Error al crear guía")
    }
  }

  const toggleGuide = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/guides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        setGuides(guides.map((g) => (g.id === id ? { ...g, isActive: !isActive } : g)))
        toast.success(isActive ? "Guía desactivada" : "Guía activada")
      }
    } catch {
      toast.error("Error al actualizar guía")
    }
  }

  const deleteGuide = async (id: string) => {
    if (!confirm("¿Eliminar esta guía permanentemente?")) return
    try {
      const res = await fetch(`/api/admin/guides/${id}`, { method: "DELETE" })
      if (res.ok) {
        setGuides(guides.filter((g) => g.id !== id))
        toast.success("Guía eliminada")
      }
    } catch {
      toast.error("Error al eliminar guía")
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-[#666666] hover:text-[#1A1A1A] inline-flex items-center gap-1 mb-4">
              <ArrowLeft className="w-3 h-3" /> Volver al panel
            </Link>
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
              <Download className="w-3.5 h-3.5 mr-2" />
              Guías Digitales
            </Badge>
          <h1 className="font-serif text-3xl font-semibold text-[#1A1A1A]">
            Gestionar <span className="gradient-text">Guías</span>
          </h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-[#88B078] text-[#1A1A1A] hover:bg-[#78A068]">
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Cancelar" : "Nueva Guía"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 border-[#88B078]">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-[#1A1A1A]">Crear guía digital</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#1A1A1A]">Título *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-background text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#1A1A1A]">Slug *</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-background text-[#1A1A1A]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[#1A1A1A]">Descripción *</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-background text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#1A1A1A]">Descripción corta</label>
                  <input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-background text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#1A1A1A]">Imagen URL *</label>
                  <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-background text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#1A1A1A]">Categoría *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-background text-[#1A1A1A]">
                    <option value="skincare">Skincare</option>
                    <option value="rutinas">Rutinas</option>
                    <option value="ingredientes">Ingredientes</option>
                    <option value="proteccion-solar">Protección Solar</option>
                    <option value="anti-edad">Anti-edad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#1A1A1A]">Precio (USD) *</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-background text-[#1A1A1A]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#1A1A1A]">File URL (PDF)</label>
                  <input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} className="w-full px-3 py-2 border border-[#E8E8E8] rounded-lg bg-background text-[#1A1A1A]" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={createGuide} className="bg-[#88B078] text-[#1A1A1A]">Crear Guía</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-[#666666] text-center py-8">Cargando guías...</p>
        ) : guides.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-[#666666]">No hay guías creadas</CardContent></Card>
        ) : (
          <Card className="border-[#E8E8E8] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E8E8]">
                    <th className="text-left p-4 font-medium text-[#666666]">Guía</th>
                    <th className="text-left p-4 font-medium text-[#666666]">Categoría</th>
                    <th className="text-left p-4 font-medium text-[#666666]">Precio</th>
                    <th className="text-left p-4 font-medium text-[#666666]">Ventas</th>
                    <th className="text-left p-4 font-medium text-[#666666]">Estado</th>
                    <th className="text-left p-4 font-medium text-[#666666]">Creada</th>
                    <th className="text-left p-4 font-medium text-[#666666]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {guides.map((guide) => (
                    <tr key={guide.id} className="border-b border-[#E8E8E8]/10 hover:bg-[#E2ECE0] transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-[#1A1A1A]">{guide.title}</p>
                        <p className="text-xs text-[#666666]">/{guide.slug}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">{guide.category}</Badge>
                      </td>
                      <td className="p-4 font-medium">{formatPrice(guide.price)}</td>
                      <td className="p-4">{guide._count.purchases}</td>
                      <td className="p-4">
                        <Badge variant={guide.isActive ? "default" : "secondary"} className={guide.isActive ? "bg-[#88B078] text-[#1A1A1A]" : ""}>
                          {guide.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                      </td>
                      <td className="p-4 text-[#666666] text-xs">{formatDate(guide.createdAt)}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleGuide(guide.id, guide.isActive)}>
                            {guide.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteGuide(guide.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
