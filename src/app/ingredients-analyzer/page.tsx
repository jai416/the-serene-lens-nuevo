"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Camera, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import WebcamCapture from "@/components/webcam-capture"

interface Ingredient {
  name: string
  function: string
  category: "benefits" | "caution" | "avoid"
  explanation?: string
}

interface ScanResult {
  productName?: string
  ingredients: Ingredient[]
  summary: string
}

export default function IngredientsAnalyzerPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState("")
  const [showCamera, setShowCamera] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida")
      return
    }
    setFile(f)
    setResult(null)
    setError("")
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleCameraCapture = (blob: Blob) => {
    const f = new File([blob], "camera-capture.jpg", { type: "image/jpeg" })
    setFile(f)
    setResult(null)
    setError("")
    setShowCamera(false)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleScan = async () => {
    if (!file) return
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/ingredients-analyzer")}`)
      return
    }
    setScanning(true)
    setError("")
    setResult(null)

    const formData = new FormData()
    formData.append("image", file)

    try {
      const res = await fetch("/api/product-scan", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error?.message || d.error || "Error al escanear")
      }
      const d = await res.json()
      setResult(d?.data?.result || d?.result)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al escanear"
      setError(msg)
    } finally {
      setScanning(false)
    }
  }

  const categoryColors: Record<string, string> = {
    benefits: "bg-green-100 text-green-800",
    caution: "bg-yellow-100 text-yellow-800",
    avoid: "bg-red-100 text-red-800",
  }
  const categoryLabels: Record<string, string> = {
    benefits: "Beneficioso",
    caution: "Precaución",
    avoid: "Evitar",
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Camera className="w-3.5 h-3.5 mr-2" />
            Analizador de Ingredientes
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A] mb-2">
            Analizador de Ingredientes Cosméticos
          </h1>
          <p className="text-[#666666] max-w-lg mx-auto">
            Sube una foto de la lista de ingredientes y obtén un análisis completo con IA.
          </p>
        </div>

        {/* Upload area */}
        {!result && (
          <Card className="p-6 mb-8">
            <CardContent className="p-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {preview ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-[#E8E8E8]">
                    <img src={preview} alt="Vista previa" className="w-full max-h-80 object-contain bg-[#F8F9FA]" />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={handleScan}
                      disabled={scanning}
                      className="flex-1"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-pulse" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Analizar ingredientes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { setFile(null); setPreview(null); setResult(null); setShowCamera(false) }}
                    >
                      Cambiar foto
                    </Button>
                  </div>
                </div>
              ) : showCamera ? (
                <WebcamCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#E8E8E8] rounded-xl p-12 text-center hover:border-[#88B078] hover:bg-[#F8F9FA] transition-colors"
                  >
                    <Upload className="w-10 h-10 text-[#88B078] mx-auto mb-3" />
                    <p className="font-medium text-[#1A1A1A] mb-1">
                      Sube una foto de los ingredientes
                    </p>
                    <p className="text-sm text-[#999999]">
                      JPG, PNG — máximo 10MB
                    </p>
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#E8E8E8]" />
                    </div>
                    <div className="relative flex justify-center text-xs text-[#999999]">
                      <span className="bg-white px-2">o</span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCamera(true)}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Escanear con cámara
                  </Button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {result.productName && (
              <Card className="p-5">
                <CardContent className="p-0">
                  <p className="text-sm text-[#999999] mb-1">Producto detectado</p>
                  <h2 className="font-serif text-xl font-semibold text-[#1A1A1A]">
                    {result.productName}
                  </h2>
                </CardContent>
              </Card>
            )}

            <Card className="p-5">
              <CardContent className="p-0">
                <h3 className="font-medium text-[#1A1A1A] mb-3">
                  Resumen
                </h3>
                <p className="text-sm text-[#666666] leading-relaxed">
                  {result.summary}
                </p>
              </CardContent>
            </Card>

            <Card className="p-5">
              <CardContent className="p-0">
                <h3 className="font-medium text-[#1A1A1A] mb-4">
                  Ingredientes {(result.ingredients?.length || 0)}
                </h3>
                <div className="space-y-3">
                  {(result.ingredients || []).map((ing, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F9FA] border border-[#E8E8E8]/50">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#88B078]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-[#1A1A1A]">
                            {ing.name}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[ing.category]}`}>
                            {categoryLabels[ing.category]}
                          </span>
                        </div>
                        <p className="text-xs text-[#666666] mt-0.5">
                          {ing.function}
                        </p>
                        {ing.explanation && (
                          <p className="text-xs text-[#999999] mt-0.5 italic">
                            {ing.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => { setFile(null); setPreview(null); setResult(null) }}
                className="flex-1"
              >
                Analizar otro producto
              </Button>
              <Link href="/products" className="flex-1">
                <Button variant="primary" className="w-full">
                  Ver catálogo de productos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Info sections */}
        {!result && !preview && (
          <>
            <Card className="p-6 mb-6">
              <CardContent className="p-0">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">¿Qué analiza?</h2>
                <div className="space-y-3 text-sm text-[#666666]">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0" />
                    <div><strong>Ingredientes beneficiosos</strong> — Componentes que aportan valor a tu piel</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 shrink-0" />
                    <div><strong>Ingredientes con precaución</strong> — Pueden causar reacciones en ciertos tipos de piel</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0" />
                    <div><strong>Ingredientes a evitar</strong> — Comúnmente evitados en cosmética</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-[#88B078]/20 rounded-xl p-6 text-center">
              <p className="text-[#1A1A1A] font-semibold mb-2">¿También quieres analizar tu piel?</p>
              <p className="text-sm text-[#666666] mb-4">
                Usa The Serene Lens para obtener un análisis cosmético completo de tu piel.
              </p>
              <Link href="/analysis">
                <Button variant="primary">
                  Analizar mi piel gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-[#999999] mt-6 text-center">
              Análisis cosmético, no diagnóstico médico. Los resultados son orientativos.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
