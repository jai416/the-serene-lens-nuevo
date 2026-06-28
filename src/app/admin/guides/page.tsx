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

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-[#64705E] dark:text-[#9BAA93]">Cargando...</p></div>
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
    <div className="min-h-screen bg-[#F8FAF5] dark:bg-[#1A1F19] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-[#64705E] dark:text-[#9BAA93] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6] inline-flex items-center gap-1 mb-4">
              <ArrowLeft className="w-3 h-3" /> Volver al panel
            </Link>
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
              <Download className="w-3.5 h-3.5 mr-2" />
              Guías Digitales
            </Badge>
          <h1 className="font-serif text-3xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6]">
            Gestionar <span className="gradient-text">Guías</span>
          </h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-[#C2E09D] text-[#2F3A2D] hover:bg-[#B0D48E]">
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Cancelar" : "Nueva Guía"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 border-[#C2E09D]">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6]">Crear guía digital</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Título *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg bg-background text-[#2F3A2D] dark:text-[#E8EDE6]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Slug *</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg bg-background text-[#2F3A2D] dark:text-[#E8EDE6]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Descripción *</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg bg-background text-[#2F3A2D] dark:text-[#E8EDE6]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Descripción corta</label>
                  <input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} className="w-full px-3 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg bg-background text-[#2F3A2D] dark:text-[#E8EDE6]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Imagen URL *</label>
                  <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg bg-background text-[#2F3A2D] dark:text-[#E8EDE6]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Categoría *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg bg-background text-[#2F3A2D] dark:text-[#E8EDE6]">
                    <option value="skincare">Skincare</option>
                    <option value="rutinas">Rutinas</option>
                    <option value="ingredientes">Ingredientes</option>
                    <option value="proteccion-solar">Protección Solar</option>
                    <option value="anti-edad">Anti-edad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">Precio (USD) *</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg bg-background text-[#2F3A2D] dark:text-[#E8EDE6]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">File URL (PDF)</label>
                  <input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} className="w-full px-3 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg bg-background text-[#2F3A2D] dark:text-[#E8EDE6]" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={createGuide} className="bg-[#C2E09D] text-[#2F3A2D]">Crear Guía</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-[#64705E] dark:text-[#9BAA93] text-center py-8">Cargando guías...</p>
        ) : guides.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-[#64705E] dark:text-[#9BAA93]">No hay guías creadas</CardContent></Card>
        ) : (
          <Card className="border-[#DDE7D3] dark:border-[#3A4536] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DDE7D3] dark:border-[#3A4536]">
                    <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Guía</th>
                    <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Categoría</th>
                    <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Precio</th>
                    <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Ventas</th>
                    <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Estado</th>
                    <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Creada</th>
                    <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {guides.map((guide) => (
                    <tr key={guide.id} className="border-b border-[#DDE7D3]/10 dark:border-[#3A4536]/10 hover:bg-[#F0F5EC] dark:bg-[#2A3228] transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">{guide.title}</p>
                        <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">/{guide.slug}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">{guide.category}</Badge>
                      </td>
                      <td className="p-4 font-medium">{formatPrice(guide.price)}</td>
                      <td className="p-4">{guide._count.purchases}</td>
                      <td className="p-4">
                        <Badge variant={guide.isActive ? "default" : "secondary"} className={guide.isActive ? "bg-[#C2E09D] text-[#2F3A2D]" : ""}>
                          {guide.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                      </td>
                      <td className="p-4 text-[#64705E] dark:text-[#9BAA93] text-xs">{formatDate(guide.createdAt)}</td>
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
