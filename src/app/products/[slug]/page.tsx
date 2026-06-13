"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ArrowLeft, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDesc: string | null
  image: string
  category: string
  skinTypes: string
  price: number
  ingredients: string | null
  isActive: boolean
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await fetch(`/api/products/${slug}`)
        if (!res.ok) throw new Error("Not found")
        const data = await res.json()
        setProduct(data.product)
      } catch {
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-xl font-semibold mb-2">Producto no encontrado</h2>
          <p className="text-muted-foreground text-sm mb-6">Este producto no existe o ha sido eliminado.</p>
          <Link href="/products">
            <Button className="rounded-full">
              <Package className="w-4 h-4 mr-2" />
              Ver productos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => router.push("/products")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a productos
        </Button>

        <div className="grid sm:grid-cols-2 gap-8">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            <Image
              src={product.image || "/images/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <Badge variant="secondary" className="mb-3">{product.category}</Badge>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-3">{product.name}</h1>
            <p className="text-sm text-muted-foreground mb-4">{product.description}</p>

            {product.skinTypes && product.skinTypes !== "all" && (
              <p className="text-sm mb-2">
                <span className="font-medium">Tipo de piel:</span>{" "}
                <span className="text-muted-foreground">{product.skinTypes}</span>
              </p>
            )}

            {product.ingredients && (
                <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.15)] mt-4">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">Ingredientes</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">{product.ingredients}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
