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
import { CardSkeleton } from "@/components/ui/skeleton"

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

  const categoryImages: Record<string, string> = {
    limpiadores: "https://images.pexels.com/photos/7691100/pexels-photo-7691100.jpeg",
    hidratantes: "https://images.pexels.com/photos/7691102/pexels-photo-7691102.jpeg",
    serums: "https://images.pexels.com/photos/7321647/pexels-photo-7321647.jpeg",
    "proteccion-solar": "https://images.pexels.com/photos/7691166/pexels-photo-7691166.jpeg",
    exfoliantes: "https://images.pexels.com/photos/6167866/pexels-photo-6167866.jpeg",
    mascarillas: "https://images.pexels.com/photos/4760317/pexels-photo-4760317.jpeg",
    aceites: "https://images.pexels.com/photos/7321507/pexels-photo-7321507.jpeg",
    contornos: "https://images.pexels.com/photos/8076226/pexels-photo-8076226.jpeg",
  }

  useEffect(() => {
    const controller = new AbortController()
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/products?limit=50", { signal: controller.signal })
        if (res.ok) {
          const data = await res.json()
          const rawProducts = (data?.data?.products || data.products || []) as Product[]
          const productsWithImages = rawProducts.map((p) => ({
            ...p,
            image: p.image || categoryImages[p.category] || "https://images.pexels.com/photos/7691166/pexels-photo-7691166.jpeg"
          }))
          setAllProducts(productsWithImages)
        }
      } catch {
        toast.error("Error al cargar productos")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
    return () => controller.abort()
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
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2 text-[#3D3229]">
            Catálogo de Productos
          </h1>
          <p className="text-[#8A7A6A] max-w-lg mx-auto">
            Explora nuestra selección de productos de skincare.
          </p>
        </div>

        {/* Link to ingredients analyzer */}
        <Card className="p-5 mb-10">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#E8D5C4] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-[#3D3229]" />
                </div>
                <div>
                  <h2 className="font-medium text-sm text-[#3D3229]">¿Tienes un producto?</h2>
                  <p className="text-xs text-[#8A7A6A]">Analiza sus ingredientes con IA</p>
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
                    ? "bg-[#E8D5C4] text-[#3D3229]"
                    : "bg-[#F0F5EC] hover:bg-[#E8F0E0] text-[#8A7A6A]"
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
                      ? "bg-[#E8D5C4] text-[#3D3229]"
                      : "bg-[#F0F5EC] hover:bg-[#E8F0E0] text-[#8A7A6A]"
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
          <h2 className="font-serif text-2xl font-semibold text-[#3D3229] mb-6">Catálogo de Productos</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
          ) : products.length === 0 ? (
            <p className="text-center text-[#8A7A6A] py-10">No hay productos disponibles.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card className="hover:ring-1 hover:ring-[#E8D5C4] transition-all h-full group overflow-hidden">
                    <div className="relative aspect-square bg-[#FFF8F0] overflow-hidden">
                      <Image
                        src={product.image || "/images/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="text-[10px] mb-2">{product.category}</Badge>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2 text-[#3D3229]">{product.name}</h3>
                      <p className="text-xs text-[#8A7A6A] line-clamp-2">{product.shortDesc}</p>
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
