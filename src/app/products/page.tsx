"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Scan, Camera, Upload, ArrowRight, Loader2, AlertCircle, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react"
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
          setProducts(data.products || [])
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

      if (data.result?.summary) {
        data.result.summary = sanitizeText(data.result.summary)
      }

      setScanResult(data.result)
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
          <Badge variant="neon" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Package className="w-3.5 h-3.5 mr-2" />
            Productos
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2">
            Escáner de <span className="gradient-text">Productos</span>
          </h1>
          <p className="text-on-surface-variant max-w-lg mx-auto">
            Escanea la lista de ingredientes de cualquier producto cosmético y descubre su función cosmética.
          </p>
        </div>

        {/* Scanner */}
        <Card className="p-6 mb-10 border-[rgba(255,255,255,0.25)]">
          <CardContent className="p-0">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="font-serif text-lg font-semibold mb-1">Escanea un producto</h2>
              <p className="text-sm text-on-surface-variant mb-4">
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
                variant="neon"
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
              <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {scanError}
              </div>
            )}

            {scanResult && (
              <div className="mt-6 space-y-4 animate-fade-in-up">
                {scanResult.productName && (
                  <p className="font-medium text-sm">
                    Producto detectado: <span className="text-primary">{scanResult.productName}</span>
                  </p>
                )}

                <p className="text-sm text-on-surface-variant bg-[rgba(255,255,255,0.04)] rounded-xl p-4">
                  {scanResult.summary}
                </p>

                <div className="grid sm:grid-cols-3 gap-3">
                  {scanResult.analysis.good.length > 0 && (
                    <div className="p-3 rounded-xl bg-[rgba(183,255,42,0.08)]">
                      <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Buenos
                      </p>
                      <ul className="space-y-1">
                        {scanResult.analysis.good.map((ing, i) => (
                          <li key={i} className="text-xs text-on-surface-variant">{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scanResult.analysis.caution.length > 0 && (
                    <div className="p-3 rounded-xl bg-[rgba(255,200,50,0.08)]">
                      <p className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Precaución
                      </p>
                      <ul className="space-y-1">
                        {scanResult.analysis.caution.map((ing, i) => (
                          <li key={i} className="text-xs text-on-surface-variant">{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scanResult.analysis.avoid.length > 0 && (
                    <div className="p-3 rounded-xl bg-[rgba(255,100,100,0.08)]">
                      <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Evitar
                      </p>
                      <ul className="space-y-1">
                        {scanResult.analysis.avoid.map((ing, i) => (
                          <li key={i} className="text-xs text-on-surface-variant">{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)]">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant">
                    Este análisis es informativo y se basa en reconocimiento de ingredientes. No constituye
                    una recomendación médica. Siempre consulta con un profesional ante cualquier duda.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catalog */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-semibold">Catálogo de Productos</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setCategory("")}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                  !category ? "bg-primary text-primary-foreground" : "bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)]"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                    category === cat ? "bg-primary text-primary-foreground" : "bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-on-surface-variant py-10">Cargando productos...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-on-surface-variant py-10">No hay productos disponibles.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card className="border-[rgba(255,255,255,0.25)] hover:border-primary/30 transition-all h-full group overflow-hidden">
                    <div className="relative aspect-square bg-[rgba(255,255,255,0.03)] overflow-hidden">
                      <Image
                        src={product.image || "/images/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="text-[10px] mb-2">{product.category}</Badge>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2">{product.shortDesc}</p>
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
