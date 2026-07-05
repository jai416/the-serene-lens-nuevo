"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Scan,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  User,
  Droplets,
  ClipboardList,
  Trash2,
} from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { compressImage } from "@/lib/image-compression"
import { validatePhoto } from "@/lib/photo-quality"
import { getPhotoSteps } from "@/lib/photo-steps"
import { trackAnalysisStarted, trackAnalysisPhotoUploaded, trackAnalysisAbandoned } from "@/lib/tracking"
import Link from "next/link"

const photoSteps = getPhotoSteps()

export default function AnalysisPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [consentAccepted, setConsentAccepted] = useState(false)
  const initialPhotos = Object.fromEntries(
    photoSteps.map((s) => [s.id, { file: null as File | null, preview: null as string | null }])
  )
  const [photos, setPhotos] = useState<Record<string, { file: File | null; preview: string | null }>>(initialPhotos)
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [climate, setClimate] = useState("")
  const [concerns, setConcerns] = useState("")
  const [routine, setRoutine] = useState("")
  const [error, setError] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activePhotoSlot, setActivePhotoSlot] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasTrackedStart = useRef(false)
  const abandonTracked = useRef(false)

  useEffect(() => {
    const handleAbandon = () => {
      if (!abandonTracked.current) {
        abandonTracked.current = true
        const photoCount = Object.values(photos).filter((p) => p.file !== null).length
        trackAnalysisAbandoned(5, photoCount)
      }
    }

    window.addEventListener("beforeunload", handleAbandon)
    return () => window.removeEventListener("beforeunload", handleAbandon)
  }, [photos])

  const handlePhoto = useCallback(async (slotId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona una imagen válida")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no debe superar los 10MB")
      return
    }

    setError("")

    try {
      const quality = await validatePhoto(file)
      if (!quality.pass) {
        const reasons: string[] = []
        if (!quality.blur.pass) reasons.push("Foto muy borrosa")
        if (!quality.brightness.pass) {
          reasons.push(quality.brightness.value < 40 ? "Foto muy oscura" : "Foto muy sobreexpuesta")
        }
        setError(reasons.join(". ") + ". Toma una foto con mejor iluminación y enfoca bien.")
        trackAnalysisPhotoUploaded(photoSteps.findIndex((s) => s.id === slotId) + 1, false)
        return
      }

      trackAnalysisPhotoUploaded(photoSteps.findIndex((s) => s.id === slotId) + 1, true)

      const compressed = await compressImage(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos((prev) => ({
          ...prev,
          [slotId]: { file: compressed, preview: e.target?.result as string },
        }))
      }
      reader.readAsDataURL(compressed)
    } catch {
      setError("Error al procesar la imagen")
    }
  }, [])

  const removePhoto = (slotId: string) => {
    setPhotos((prev) => ({ ...prev, [slotId]: { file: null, preview: null } }))
  }

  const requiredPhotosDone = photoSteps.length === 2
    ? photos.front.file !== null && photos.side.file !== null
    : photos.front.file !== null && photos.left.file !== null && photos.right.file !== null
  const photosCount = Object.values(photos).filter((p) => p.file !== null).length

  const handleAnalyze = async () => {
    if (!requiredPhotosDone) return
    if (!session) {
      router.push("/login?callbackUrl=/analysis")
      return
    }
    setIsAnalyzing(true)

    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true
      trackAnalysisStarted()
    }

    const formData = new FormData()
    Object.entries(photos).forEach(([id, p]) => {
      if (p.file) formData.append("photos", p.file)
    })
    formData.append("age", age)
    formData.append("gender", gender)
    formData.append("climate", climate)
    formData.append("concerns", concerns)
    formData.append("routine", routine)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || data.error || "Error al analizar")
      }

      const data = await res.json()
      router.push(`/analysis/results/${data.analysis.id}`)
    } catch (e: any) {
      setError(e.message || "Error al analizar las imágenes")
      setIsAnalyzing(false)
    }
  }

  const handleTriggerUpload = (slotId: string) => {
    setActivePhotoSlot(slotId)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && activePhotoSlot) {
      handlePhoto(activePhotoSlot, file)
    }
    e.target.value = ""
    setActivePhotoSlot(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handlePhoto(slotId, file)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAF5" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Scan className="w-3.5 h-3.5 mr-2" />
            Observación de Piel
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2" style={{ color: "#2F3A2D" }}>
            Conoce tu Piel
          </h1>
          <p style={{ color: "#64705E" }}>Completa los datos para recibir observaciones cosméticas personalizadas.</p>
        </div>

        {status === "unauthenticated" && (
          <Card className="mb-8" style={{ borderRadius: "20px", borderColor: "#DDE7D3" }}>
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#C2E09D" }}>
                <User className="w-7 h-7" style={{ color: "#2F3A2D" }} />
              </div>
              <h2 className="font-serif text-xl font-semibold mb-2" style={{ color: "#2F3A2D" }}>Inicia sesión para continuar</h2>
              <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#64705E" }}>
                Necesitas una cuenta para realizar análisis y guardar tu historial de piel.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/login?callbackUrl=/analysis">
                  <Button variant="primary" className="px-8">
                    <User className="w-4 h-4 mr-2" />
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/login?callbackUrl=/analysis">
                  <Button variant="secondary" className="px-8">
                    Crear cuenta gratis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {error && !isAnalyzing && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#E07070" }} />
            <span className="text-sm" style={{ color: "#E07070" }}>{error}</span>
          </div>
        )}

        {!isAnalyzing && (
          <div className="space-y-6">
            {/* ─── Section 1: Consentimiento ─── */}
            <section className="bg-white rounded-[20px] border p-6" style={{ borderColor: "#DDE7D3" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#C2E09D" }}>
                  <Shield className="w-5 h-5" style={{ color: "#2F3A2D" }} />
                </div>
                <h2 className="font-serif text-lg font-semibold" style={{ color: "#2F3A2D" }}>Consentimiento</h2>
              </div>

              <div className="text-sm leading-relaxed mb-4 p-4 rounded-xl" style={{ color: "#64705E", backgroundColor: "#F8FAF5", border: "1px solid #DDE7D3" }}>
                <p className="mb-2">
                  Esta herramienta realiza observaciones cosméticas orientativas basadas únicamente en fotografías
                  y la información proporcionada por el usuario.
                </p>
                <p>
                  No diagnostica enfermedades, no sustituye a dermatólogos ni profesionales de la salud y no debe
                  utilizarse como herramienta médica.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded"
                  style={{ accentColor: "#C2E09D", borderColor: "#DDE7D3" }}
                />
                <span className="text-sm" style={{ color: "#64705E" }}>
                  He leído y acepto los términos. Entiendo que esta herramienta no reemplaza una consulta profesional.
                </span>
              </label>
            </section>

            {/* ─── Section 2: Fotos ─── */}
            <section className="bg-white rounded-[20px] border p-6" style={{ borderColor: "#DDE7D3" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#C2E09D" }}>
                  <Camera className="w-5 h-5" style={{ color: "#2F3A2D" }} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-semibold" style={{ color: "#2F3A2D" }}>Fotos</h2>
                  <p className="text-xs" style={{ color: "#64705E" }}>{photosCount}/{photoSteps.length} fotos · Arrastra o toca para agregar</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {photoSteps.map((slot) => {
                  const photo = photos[slot.id]
                  const hasPhoto = photo?.file !== null

                  return (
                    <div
                      key={slot.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, slot.id)}
                    >
                      {hasPhoto ? (
                        <div className="relative aspect-square rounded-xl overflow-hidden" style={{ border: "1px solid #DDE7D3" }}>
                          <Image
                            src={photo.preview!}
                            alt={slot.label}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                          <button
                            onClick={() => removePhoto(slot.id)}
                            className="absolute top-2 right-2 text-xs px-2.5 py-1.5 rounded-full shadow-sm backdrop-blur-sm"
                            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#64705E", border: "1px solid #DDE7D3" }}
                            aria-label="Quitar foto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div
                            className="absolute bottom-2 left-2 text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm"
                            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#2F3A2D", border: "1px solid #DDE7D3" }}
                          >
                            <CheckCircle2 className="w-3 h-3 inline mr-1" style={{ color: "#64705E" }} />
                            {slot.label}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleTriggerUpload(slot.id)}
                          className="w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all hover:opacity-80"
                          style={{ borderColor: "#DDE7D3", backgroundColor: "#F8FAF5" }}
                          aria-label={`Agregar ${slot.label}`}
                        >
                          <Camera className="w-6 h-6" style={{ color: "#64705E" }} />
                          <span className="text-xs font-medium" style={{ color: "#64705E" }}>Agregar foto</span>
                          <span className="text-[10px]" style={{ color: "#64705E" }}>{slot.label}</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </section>

            {/* ─── Section 3: Datos ─── */}
            <section className="bg-white rounded-[20px] border p-6" style={{ borderColor: "#DDE7D3" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#C2E09D" }}>
                  <User className="w-5 h-5" style={{ color: "#2F3A2D" }} />
                </div>
                <h2 className="font-serif text-lg font-semibold" style={{ color: "#2F3A2D" }}>Datos</h2>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: "#2F3A2D" }}>
                    Edad
                  </label>
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] appearance-none"
                    style={{ border: "1px solid #DDE7D3", backgroundColor: "white", color: "#2F3A2D" }}
                  >
                    <option value="">Selecciona</option>
                    {["<18", "18-24", "25-30", "31-40", "41-50", "51+"].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: "#2F3A2D" }}>
                    Sexo
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] appearance-none"
                    style={{ border: "1px solid #DDE7D3", backgroundColor: "white", color: "#2F3A2D" }}
                  >
                    <option value="">Selecciona</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: "#2F3A2D" }}>
                    Clima
                  </label>
                  <select
                    value={climate}
                    onChange={(e) => setClimate(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] appearance-none"
                    style={{ border: "1px solid #DDE7D3", backgroundColor: "white", color: "#2F3A2D" }}
                  >
                    <option value="">Selecciona</option>
                    <option value="tropical">Tropical</option>
                    <option value="seco">Seco/Árido</option>
                    <option value="templado">Templado</option>
                    <option value="frio">Frío</option>
                    <option value="humedo">Húmedo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2" style={{ color: "#2F3A2D" }}>
                    <Droplets className="w-4 h-4" style={{ color: "#64705E" }} />
                    Principales preocupaciones
                  </label>
                  <textarea
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                    placeholder="Ej: manchas, arrugas, ojeras, piel opaca, poros abiertos..."
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] min-h-[80px] resize-none placeholder-[#64705E]"
                    style={{ border: "1px solid #DDE7D3", backgroundColor: "white", color: "#2F3A2D" }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2" style={{ color: "#2F3A2D" }}>
                    <ClipboardList className="w-4 h-4" style={{ color: "#64705E" }} />
                    Rutina actual
                  </label>
                  <textarea
                    value={routine}
                    onChange={(e) => setRoutine(e.target.value)}
                    placeholder="Ej: lavo mi cara con jabón neutro y uso crema hidratante..."
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] min-h-[80px] resize-none placeholder-[#64705E]"
                    style={{ border: "1px solid #DDE7D3", backgroundColor: "white", color: "#2F3A2D" }}
                  />
                </div>
              </div>
            </section>

            {/* ─── Section 4: Analizar ─── */}
            <button
              onClick={handleAnalyze}
              disabled={!consentAccepted || !requiredPhotosDone || status === "loading"}
              className="w-full py-4 rounded-[20px] font-semibold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: !consentAccepted || !requiredPhotosDone ? "#DDE7D3" : "#2F3A2D",
                color: !consentAccepted || !requiredPhotosDone ? "#64705E" : "white",
              }}
            >
              <Scan className="w-5 h-5 inline mr-2" />
              Analizar mi piel
            </button>
          </div>
        )}

        {/* ─── Analyzing State ─── */}
        {isAnalyzing && (
          <div className="text-center py-16">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "#C2E09D" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#2F3A2D" }} />
              </div>
            </div>
            <h2 className="font-serif text-xl font-semibold mb-2" style={{ color: "#2F3A2D" }}>
              Analizando tus fotos...
            </h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "#64705E" }}>
              Estamos examinando las características visibles desde múltiples ángulos.
              Esto toma solo unos segundos.
            </p>
            <div
              className="mt-8 max-w-xs mx-auto h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "#DDE7D3" }}
              role="progressbar"
              aria-label="Progreso del análisis"
            >
              <div className="h-full w-1/3 rounded-full animate-pulse" style={{ backgroundColor: "#C2E09D" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
