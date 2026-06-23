import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ArrowLeft } from "lucide-react"
import Image from "next/image"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await db.product.findUnique({
    where: { slug, isActive: true },
    select: { name: true, shortDesc: true, description: true, image: true, slug: true, price: true, category: true },
  })

  if (!product) return { title: "Producto no encontrado" }

  const description = product.shortDesc || product.description.slice(0, 160)
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/products/${product.slug}`

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url,
      siteName: "The Serene Lens",
      locale: "es_ES",
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.image ? [product.image] : [],
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await db.product.findUnique({
    where: { slug, isActive: true },
  })

  if (!product) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc || product.description,
    image: product.image || undefined,
    sku: product.id,
    brand: {
      "@type": "Organization",
      name: "The Serene Lens",
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/products/${product.slug}`,
    },
  }

  const skinTypeLabels: Record<string, string> = {
    all: "Todos los tipos",
    oily: "Piel grasa",
    dry: "Piel seca",
    combination: "Piel mixta",
    sensitive: "Piel sensible",
    normal: "Piel normal",
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        <Link href="/products">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver a productos
          </Button>
        </Link>

        <div className="grid sm:grid-cols-2 gap-8">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F8FAF5] border border-[#DDE7D3]">
            <Image
              src={product.image || "/images/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <Badge variant="secondary" className="mb-3">
              {product.category}
            </Badge>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-3">
              {product.name}
            </h1>

            {product.shortDesc && (
              <p className="text-sm text-[#64705E] mb-2">{product.shortDesc}</p>
            )}

            <p className="text-sm text-[#2F3A2D] mb-4">{product.description}</p>

            {product.price > 0 && (
              <p className="text-lg font-semibold text-[#2F3A2D] mb-4">
                {formatPrice(product.price)}
              </p>
            )}

            {product.skinTypes && product.skinTypes !== "all" && (
              <p className="text-sm mb-2">
                <span className="font-medium text-[#2F3A2D]">Tipo de piel:</span>{" "}
                <span className="text-[#64705E]">
                  {skinTypeLabels[product.skinTypes] || product.skinTypes}
                </span>
              </p>
            )}

            {product.ingredients && (
              <Card className="bg-[#F8FAF5] border-[#DDE7D3] mt-4">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-[#2F3A2D]">
                    Ingredientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-[#64705E] leading-relaxed">
                    {product.ingredients}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
