"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import Head from "next/head"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Camera, ArrowRight } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  slug: string
  shortDesc: string | null
  image: string
  category: string
  skinTypes: string
}

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("")

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/products?limit=50")
        if (res.ok) {
          const data = await res.json()
          setAllProducts(data?.data?.products || data.products || [])
        }
      } catch {
        toast.error("Error al cargar productos")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const categories = useMemo(() => {
    return allProducts.reduce<string[]>((acc, p) => {
      if (!acc.includes(p.category)) acc.push(p.category)
      return acc
    }, [])
  }, [allProducts])

  const products = useMemo(() => {
    if (!selectedCategory) return allProducts
    return allProducts.filter((p) => p.category === selectedCategory)
  }, [allProducts, selectedCategory])

  return (
    <div className="min-h-screen px-4 py-8">
      <Head>
        <title>Escáner de Productos y Catálogo | The Serene Lens</title>
        <meta name="description" content="Escanea la lista de ingredientes de cualquier producto cosmético y descubre su función cosmética. Catálogo de 50+ productos analizados." />
        <meta property="og:title" content="Escáner de Productos | The Serene Lens" />
        <meta property="og:description" content="Escanea ingredientes y descubre la función de cada componente de tu producto cosmético." />
      </Head>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Package className="w-3.5 h-3.5 mr-2" />
            Productos
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2 text-[#2F3A2D]">
            Catálogo de Productos
          </h1>
          <p className="text-[#64705E] max-w-lg mx-auto">
            Explora nuestra selección de productos de skincare.
          </p>
        </div>

        {/* Link to ingredients analyzer */}
        <Card className="p-5 mb-10">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#C2E09D] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-[#2F3A2D]" />
                </div>
                <div>
                  <h2 className="font-medium text-sm text-[#2F3A2D]">¿Tienes un producto?</h2>
                  <p className="text-xs text-[#64705E]">Analiza sus ingredientes con IA</p>
                </div>
              </div>
              <Link href="/ingredients-analyzer">
                <Button variant="primary" size="sm">
                  Analizar
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Category filter */}
        {!loading && (
          <div className="mb-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors font-medium ${
                  !selectedCategory
                    ? "bg-[#C2E09D] text-[#2F3A2D]"
                    : "bg-[#F0F5EC] hover:bg-[#E8F0E0] text-[#64705E]"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors font-medium ${
                    selectedCategory === cat
                      ? "bg-[#C2E09D] text-[#2F3A2D]"
                      : "bg-[#F0F5EC] hover:bg-[#E8F0E0] text-[#64705E]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Catalog */}
        <div className="mb-8">
          <h2 className="font-serif text-2xl font-semibold text-[#2F3A2D] mb-6">Catálogo de Productos</h2>

          {loading ? (
            <p className="text-center text-[#64705E] py-10">Cargando productos...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-[#64705E] py-10">No hay productos disponibles.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card className="hover:ring-1 hover:ring-[#C2E09D] transition-all h-full group overflow-hidden">
                    <div className="relative aspect-square bg-[#F8FAF5] overflow-hidden">
                      <Image
                        src={product.image || "/images/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="text-[10px] mb-2">{product.category}</Badge>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2 text-[#2F3A2D]">{product.name}</h3>
                      <p className="text-xs text-[#64705E] line-clamp-2">{product.shortDesc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
