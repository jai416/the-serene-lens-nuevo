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
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const FALLBACK_IMAGE = "/images/placeholder.svg"

  const handleImageError = (productId: string) => {
    setFailedImages((prev) => new Set(prev).add(productId))
  }

  const CDN = "https://images.pexels.com/photos"
  const categoryImages: Record<string, string> = {
    limpiadores: `${CDN}/7691100/pexels-photo-7691100.jpeg?auto=compress&cs=tinysrgb&w=600`,
    hidratantes: `${CDN}/7691104/pexels-photo-7691104.jpeg?auto=compress&cs=tinysrgb&w=600`,
    serums: `${CDN}/7321646/pexels-photo-7321646.jpeg?auto=compress&cs=tinysrgb&w=600`,
    "proteccion-solar": `${CDN}/7691165/pexels-photo-7691165.jpeg?auto=compress&cs=tinysrgb&w=600`,
    exfoliantes: `${CDN}/6167865/pexels-photo-6167865.jpeg?auto=compress&cs=tinysrgb&w=600`,
    mascarillas: `${CDN}/4760317/pexels-photo-4760317.jpeg?auto=compress&cs=tinysrgb&w=600`,
    aceites: `${CDN}/7321507/pexels-photo-7321507.jpeg?auto=compress&cs=tinysrgb&w=600`,
    contornos: `${CDN}/8076225/pexels-photo-8076225.jpeg?auto=compress&cs=tinysrgb&w=600`,
    kits: `${CDN}/4465130/pexels-photo-4465130.jpeg?auto=compress&cs=tinysrgb&w=600`,
  }

  useEffect(() => {
    const controller = new AbortController()
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/products?limit=50", { signal: controller.signal })
        if (res.ok) {
          const data = await res.json()
          const raw = data?.data?.products || data.products
          const rawProducts = Array.isArray(raw) ? raw : []
          const productsWithImages = rawProducts.map((p) => ({
            ...p,
            image: p.image || categoryImages[p.category] || "/images/products/pexels-7691166.jpg"
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
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Package className="w-3.5 h-3.5 mr-2" />
            Productos
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2 text-[#1A1A1A]">
            Catálogo de Productos
          </h1>
          <p className="text-[#666666] max-w-lg mx-auto">
            Explora nuestra selección de productos de skincare.
          </p>
        </div>

        {/* Link to ingredients analyzer */}
        <Card className="p-5 mb-10">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#88B078] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <div>
                  <h2 className="font-medium text-sm text-[#1A1A1A]">¿Tienes un producto?</h2>
                  <p className="text-xs text-[#666666]">Analiza sus ingredientes con IA</p>
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
                    ? "bg-[#88B078] text-[#1A1A1A]"
                    : "bg-[#E2ECE0] hover:bg-[#E8F0E0] text-[#666666]"
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
                      ? "bg-[#88B078] text-[#1A1A1A]"
                      : "bg-[#E2ECE0] hover:bg-[#E8F0E0] text-[#666666]"
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
          <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-6">Catálogo de Productos</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
          ) : products.length === 0 ? (
            <p className="text-center text-[#666666] py-10">No hay productos disponibles.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card className="hover:ring-1 hover:ring-[#88B078] transition-all h-full group overflow-hidden">
                    <div className="relative aspect-square bg-[#F8F9FA] overflow-hidden">
                      <Image
                        src={failedImages.has(product.id) ? FALLBACK_IMAGE : (product.image || "/images/placeholder.svg")}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => handleImageError(product.id)}
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="text-[10px] mb-2">{product.category}</Badge>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2 text-[#1A1A1A]">{product.name}</h3>
                      <p className="text-xs text-[#666666] line-clamp-2">{product.shortDesc}</p>
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
