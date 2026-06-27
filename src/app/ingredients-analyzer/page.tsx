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
    benefits: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    caution: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    avoid: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }
  const categoryLabels: Record<string, string> = {
    benefits: "Beneficioso",
    caution: "Precaución",
    avoid: "Evitar",
  }

  return (
    <div className="min-h-screen bg-[#F8FAF5] dark:bg-[#1A1F19] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Camera className="w-3.5 h-3.5 mr-2" />
            Analizador de Ingredientes
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-2">
            Analizador de Ingredientes Cosméticos
          </h1>
          <p className="text-[#64705E] dark:text-[#9BAA93] max-w-lg mx-auto">
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
                  <div className="relative rounded-xl overflow-hidden border border-[#DDE7D3] dark:border-[#3A4536]">
                    <img src={preview} alt="Vista previa" className="w-full max-h-80 object-contain bg-[#F8FAF5] dark:bg-[#1E251C]" />
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
                      onClick={() => { setFile(null); setPreview(null); setResult(null) }}
                    >
                      Cambiar foto
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#DDE7D3] dark:border-[#3A4536] rounded-xl p-12 text-center hover:border-[#C2E09D] hover:bg-[#F8FAF5] dark:hover:bg-[#1E251C] transition-colors"
                >
                  <Upload className="w-10 h-10 text-[#C2E09D] mx-auto mb-3" />
                  <p className="font-medium text-[#2F3A2D] dark:text-[#E8EDE6] mb-1">
                    Sube una foto de los ingredientes
                  </p>
                  <p className="text-sm text-[#8A9A82] dark:text-[#7A8A72]">
                    JPG, PNG — máximo 10MB
                  </p>
                </button>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
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
                  <p className="text-sm text-[#8A9A82] dark:text-[#7A8A72] mb-1">Producto detectado</p>
                  <h2 className="font-serif text-xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6]">
                    {result.productName}
                  </h2>
                </CardContent>
              </Card>
            )}

            <Card className="p-5">
              <CardContent className="p-0">
                <h3 className="font-medium text-[#2F3A2D] dark:text-[#E8EDE6] mb-3">
                  Resumen
                </h3>
                <p className="text-sm text-[#64705E] dark:text-[#9BAA93] leading-relaxed">
                  {result.summary}
                </p>
              </CardContent>
            </Card>

            <Card className="p-5">
              <CardContent className="p-0">
                <h3 className="font-medium text-[#2F3A2D] dark:text-[#E8EDE6] mb-4">
                  Ingredientes ({result.ingredients.length})
                </h3>
                <div className="space-y-3">
                  {result.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAF5] dark:bg-[#1E251C] border border-[#DDE7D3]/50 dark:border-[#3A4536]/50">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#C2E09D]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-[#2F3A2D] dark:text-[#E8EDE6]">
                            {ing.name}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[ing.category]}`}>
                            {categoryLabels[ing.category]}
                          </span>
                        </div>
                        <p className="text-xs text-[#64705E] dark:text-[#9BAA93] mt-0.5">
                          {ing.function}
                        </p>
                        {ing.explanation && (
                          <p className="text-xs text-[#8A9A82] dark:text-[#7A8A72] mt-0.5 italic">
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
                <h2 className="text-xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-3">¿Qué analiza?</h2>
                <div className="space-y-3 text-sm text-[#64705E] dark:text-[#9BAA93]">
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

            <div className="bg-[#C2E09D]/20 rounded-xl p-6 text-center">
              <p className="text-[#2F3A2D] dark:text-[#E8EDE6] font-semibold mb-2">¿También quieres analizar tu piel?</p>
              <p className="text-sm text-[#64705E] dark:text-[#9BAA93] mb-4">
                Usa The Serene Lens para obtener un análisis cosmético completo de tu piel.
              </p>
              <Link href="/analysis">
                <Button variant="primary">
                  Analizar mi piel gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-[#8A9A82] dark:text-[#7A8A72] mt-6 text-center">
              Análisis cosmético, no diagnóstico médico. Los resultados son orientativos.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
