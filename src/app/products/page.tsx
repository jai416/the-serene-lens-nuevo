"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Camera, Upload, ArrowRight, Loader2, AlertCircle, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  slug: string
  shortDesc: string | null
  image: string
  category: string
  price: number
  skinTypes: string
}

interface ScanResult {
  productName?: string
  ingredients: string[]
  analysis: {
    good: string[]
    caution: string[]
    avoid: string[]
  }
  summary: string
}

const alarmistTerms = [
  "tóxico", "toxina", "veneno", "venenoso", "cancerígeno", "carcinógeno",
  "mortal", "peligroso", "dañino", "nocivo", "letal",
]

function sanitizeText(text: string): string {
  let sanitized = text
  alarmistTerms.forEach((term) => {
    const regex = new RegExp(term, "gi")
    sanitized = sanitized.replace(regex, (match) => `[${match}]`)
  })
  return sanitized
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      const url = category ? `/api/products?limit=50&category=${category}` : "/api/products?limit=50"
      try {
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setProducts(data?.data?.products || data.products || [])
        }
      } catch {
        toast.error("Error al cargar productos")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [category])

  const categories = products.reduce<string[]>((acc, p) => {
    if (!acc.includes(p.category)) acc.push(p.category)
    return acc
  }, [])

  const handleScanFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setScanError("Selecciona una imagen válida")
      return
    }
    setScanError("")
    setScanResult(null)
    setScanning(true)

    const formData = new FormData()
    formData.append("image", file)

    try {
      const res = await fetch("/api/product-scan", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Error al escanear")
      const data = await res.json()

      if (data.data?.result?.summary) {
        data.data.result.summary = sanitizeText(data.data.result.summary)
      }

      setScanResult(data?.data?.result || data.result)
    } catch (e: any) {
      setScanError(e.message || "Error al escanear")
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Package className="w-3.5 h-3.5 mr-2" />
            Productos
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2 text-[#2F3A2D]">
            Escáner de Productos
          </h1>
          <p className="text-[#64705E] max-w-lg mx-auto">
            Escanea la lista de ingredientes de cualquier producto cosmético y descubre su función cosmética.
          </p>
        </div>

        {/* Scanner */}
        <Card className="p-6 mb-10">
          <CardContent className="p-0">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-[#C2E09D] flex items-center justify-center mb-4">
                <Camera className="w-5 h-5 text-[#2F3A2D]" />
              </div>
              <h2 className="font-serif text-lg font-semibold mb-1 text-[#2F3A2D]">Escanea un producto</h2>
              <p className="text-sm text-[#64705E] mb-4">
                Sube una foto de la lista de ingredientes de tu producto
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleScanFile(file)
                }}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="primary"
                disabled={scanning}
              >
                {scanning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {scanning ? "Escaneando..." : "Subir foto"}
              </Button>
            </div>

            {scanError && (
              <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#E07070]">
                <AlertCircle className="w-4 h-4" />
                {scanError}
              </div>
            )}

            {scanResult && (
              <div className="mt-6 space-y-4 animate-fade-in-up">
                {scanResult.productName && (
                  <p className="font-medium text-sm text-[#2F3A2D]">
                    Producto detectado: <span className="font-semibold">{scanResult.productName}</span>
                  </p>
                )}

                <p className="text-sm text-[#64705E] bg-[#F8FAF5] rounded-xl p-4">
                  {scanResult.summary}
                </p>

                <div className="grid sm:grid-cols-3 gap-3">
                  {scanResult.analysis.good.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#F0F5EC]">
                      <p className="text-xs font-medium text-[#2F3A2D] mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Buenos
                      </p>
                      <ul className="space-y-1">
                        {scanResult.analysis.good.map((ing, i) => (
                          <li key={i} className="text-xs text-[#64705E]">{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scanResult.analysis.caution.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#FFF8EB]">
                      <p className="text-xs font-medium text-[#2F3A2D] mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Precaución
                      </p>
                      <ul className="space-y-1">
                        {scanResult.analysis.caution.map((ing, i) => (
                          <li key={i} className="text-xs text-[#64705E]">{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scanResult.analysis.avoid.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#FEF2F2]">
                      <p className="text-xs font-medium text-[#2F3A2D] mb-2 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Evitar
                      </p>
                      <ul className="space-y-1">
                        {scanResult.analysis.avoid.map((ing, i) => (
                          <li key={i} className="text-xs text-[#64705E]">{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F8FAF5] border border-[#DDE7D3]">
                  <Info className="w-4 h-4 text-[#2F3A2D] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#64705E]">
                    Este análisis es informativo y se basa en reconocimiento de ingredientes. No constituye
                    una recomendación médica. Siempre consulta con un profesional ante cualquier duda.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const url = `${window.location.origin}/api/og?product=${encodeURIComponent(scanResult.productName || "Producto")}&summary=${encodeURIComponent(scanResult.summary)}`
                    const shareUrl = `${window.location.origin}/products?ref=share&scan=${encodeURIComponent(scanResult.productName || "")}`
                    if (navigator.share) {
                      navigator.share({ title: scanResult.productName || "Análisis de producto", text: scanResult.summary, url: shareUrl })
                    } else {
                      navigator.clipboard.writeText(shareUrl).then(() => toast.success("Enlace copiado"))
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border border-[#DDE7D3] hover:bg-[#F0F5EC] transition-colors text-[#2F3A2D]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Compartir análisis
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catalog */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-semibold text-[#2F3A2D]">Catálogo de Productos</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setCategory("")}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  !category ? "bg-[#C2E09D] text-[#2F3A2D]" : "bg-[#F0F5EC] hover:bg-[#E8F0E0] text-[#64705E]"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                    category === cat ? "bg-[#C2E09D] text-[#2F3A2D]" : "bg-[#F0F5EC] hover:bg-[#E8F0E0] text-[#64705E]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

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
