"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, ArrowLeft, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  slug: string
  category: string
  price: number
  isActive: boolean
  createdAt: string
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState({
    name: "", slug: "", description: "", shortDesc: "",
    image: "", category: "", skinTypes: "all", ingredients: "",
  })

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/admin/products")
        .then((r) => r.ok ? r.json() : { data: { products: [] } })
        .then((d) => setProducts(d?.data?.products || d.products || []))
        .catch(() => toast.error("Error al cargar productos"))
    }
  }, [session])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-[#64705E] dark:text-[#9BAA93]">Cargando...</p></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const resetForm = () => setForm({
    name: "", slug: "", description: "", shortDesc: "",
    image: "", category: "", skinTypes: "all", ingredients: "",
  })

  const createProduct = async () => {
    if (!form.name || !form.slug) return
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug.toLowerCase().replace(/\s+/g, "-"),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const product = data?.data?.product || data.product
        setProducts([product, ...products])
        resetForm()
        toast.success("Producto creado correctamente")
      } else {
        const data = await res.json()
        toast.error(data.error?.message || data.error || "Error al crear producto")
      }
    } catch {
      toast.error("Error al crear producto")
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id))
        toast.success("Producto eliminado")
      } else {
        const data = await res.json()
        toast.error(data.error?.message || data.error || "Error al eliminar producto")
      }
    } catch {
      toast.error("Error al eliminar producto")
    }
  }

  const toggleActive = async (product: Product) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
      })
      if (res.ok) {
        setProducts(products.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p)))
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
            <Package className="w-3.5 h-3.5 mr-2" />
            Productos
          </Badge>
          <h1 className="font-serif text-3xl font-semibold">
            Administrar <span className="gradient-text">Productos</span>
          </h1>
        </div>

        {/* New Product Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Nuevo Producto
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <input placeholder="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input placeholder="Tipo de piel (all, seca, grasa...)" value={form.skinTypes} onChange={(e) => setForm({ ...form, skinTypes: e.target.value })}
                className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <input placeholder="URL de imagen" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4" />
            <textarea placeholder="Descripción corta" value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4 min-h-[60px] resize-none" />
            <textarea placeholder="Descripción completa" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4 min-h-[80px] resize-none" />
            <textarea placeholder="Ingredientes" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4 min-h-[80px] resize-none" />
            <Button onClick={createProduct} className="rounded-full ml-auto" disabled={!form.name || !form.slug}>
              <Plus className="w-4 h-4 mr-1.5" /> Crear Producto
            </Button>
          </CardContent>
        </Card>

        {/* Products List */}
        <div className="space-y-2">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${product.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">
                      {product.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(product)}>
                    {product.isActive ? "Desactivar" : "Activar"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {products.length === 0 && (
            <p className="text-center text-[#64705E] dark:text-[#9BAA93] py-10">No hay productos aún</p>
          )}
        </div>
      </div>
    </div>
  )
}
