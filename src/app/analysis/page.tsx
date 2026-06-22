"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Scan,
  Upload,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Droplets,
  ClipboardList,
  HelpCircle,
  Sun,
} from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { compressImage } from "@/lib/image-compression"
import { validatePhoto } from "@/lib/photo-quality"
import { getPhotoSteps } from "@/lib/photo-steps"
import { trackAnalysisStarted, trackAnalysisPhotoUploaded, trackAnalysisAbandoned } from "@/lib/tracking"
import Link from "next/link"

type Step = "consent" | "photos" | "questions" | "analyzing" | "done"

const photoSteps = getPhotoSteps()



export default function AnalysisPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [step, setStep] = useState<Step>("consent")
  const [consentAccepted, setConsentAccepted] = useState(false)
  const initialPhotos = Object.fromEntries(
    photoSteps.map((s) => [s.id, { file: null as File | null, preview: null as string | null }])
  )
  const [photos, setPhotos] = useState<Record<string, { file: File | null; preview: string | null }>>(initialPhotos)
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0)
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [climate, setClimate] = useState("")
  const [concerns, setConcerns] = useState("")
  const [routine, setRoutine] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasTrackedStart = useRef(false)
  const abandonTracked = useRef(false)

  useEffect(() => {
    const handleAbandon = () => {
      if (!abandonTracked.current && (step === "photos" || step === "questions")) {
        abandonTracked.current = true
        const photoCount = Object.values(photos).filter((p) => p.file !== null).length
        const currentStep = step === "photos" ? currentPhotoStep + 1 : 4
        trackAnalysisAbandoned(currentStep, photoCount)
      }
    }

    window.addEventListener("beforeunload", handleAbandon)
    return () => window.removeEventListener("beforeunload", handleAbandon)
  }, [step, currentPhotoStep, photos])

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
        trackAnalysisPhotoUploaded(currentPhotoStep + 1, false)
        return
      }

      trackAnalysisPhotoUploaded(currentPhotoStep + 1, true)

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
  const totalRequired = photoSteps.filter((s) => s.required).length

  const handleAnalyze = async () => {
    if (!requiredPhotosDone) return
    if (!session) {
      router.push("/login?callbackUrl=/analysis")
      return
    }
    setStep("analyzing")

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
      setStep("done")
      router.push(`/analysis/results/${data.analysis.id}`)
    } catch (e: any) {
      setError(e.message || "Error al analizar las imágenes")
      setStep("questions")
    }
  }

  const slot = photoSteps[currentPhotoStep]
  const currentPhoto = photos[slot.id]

  const isFirstStep = currentPhotoStep === 0
  const isLastStep = currentPhotoStep === photoSteps.length - 1
  const hasPhoto = currentPhoto?.file !== null

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Scan className="w-3.5 h-3.5 mr-2" />
            Observación de Piel
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2 text-[#2F3A2D]">
            Conoce tu Piel
          </h1>
          <p className="text-[#64705E]">Completa los pasos para recibir observaciones cosméticas personalizadas.</p>
        </div>

        {status === "unauthenticated" && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#C2E09D] flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-[#2F3A2D]" />
              </div>
              <h2 className="font-serif text-xl font-semibold mb-2 text-[#2F3A2D]">Inicia sesión para continuar</h2>
              <p className="text-sm text-[#64705E] mb-6 max-w-sm mx-auto">
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

        <div className="flex items-center justify-center gap-2 mb-8">
          {["consent", "photos", "questions"].map((s, i) => {
            const isDone =
              (s === "consent" && consentAccepted) ||
              (s === "photos" && requiredPhotosDone) ||
              (s === "questions" && step === "analyzing")
            const isCurrent = step === s
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                    isDone
                      ? "bg-[#C2E09D] text-[#2F3A2D]"
                      : isCurrent
                        ? "bg-[#F0F5EC] text-[#2F3A2D] border border-[#C2E09D]"
                        : "bg-[#F0F5EC] text-[#8A9A82]"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-px ${isDone ? "bg-[#C2E09D]" : "bg-[#DDE7D3]"}`} />}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#E07070]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Step 1: Consent ─── */}
        {step === "consent" && (
          <Card className="p-8 animate-fade-in-up">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#C2E09D] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#2F3A2D]" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#2F3A2D]">Aviso Legal</h2>
                  <p className="text-sm text-[#64705E]">Información importante antes de comenzar</p>
                </div>
              </div>

              <div className="text-sm text-[#64705E] leading-relaxed p-4 rounded-2xl bg-[#F8FAF5] mb-6 space-y-3">
                <p>
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
                  className="mt-0.5 w-4 h-4 rounded border-[#DDE7D3] bg-white accent-[#C2E09D]"
                />
                <span className="text-sm text-[#64705E]">
                  He leído y acepto los términos. Entiendo que esta herramienta no reemplaza una consulta profesional.
                </span>
              </label>

              <div className="mt-6">
                <Button
                  onClick={() => {
                    if (!hasTrackedStart.current) {
                      hasTrackedStart.current = true
                      trackAnalysisStarted()
                    }
                    setStep("photos")
                  }}
                  disabled={!consentAccepted}
                  variant="primary"
                  className="w-full py-5 h-auto"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Step 2: Photos (Guided Assistant) ─── */}
        {step === "photos" && (
          <div className="animate-fade-in-up space-y-4">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5">
              {photoSteps.map((s, i) => (
                <div
                  key={s.id}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i < currentPhotoStep
                      ? "bg-[#C2E09D]"
                      : i === currentPhotoStep
                        ? "bg-[#C2E09D] w-6"
                        : "bg-[#DDE7D3]"
                  }`}
                  aria-label={`Paso ${i + 1}: ${s.label}`}
                />
              ))}
            </div>

            <p className="text-center text-xs text-[#64705E]">
              Paso {currentPhotoStep + 1} de {photoSteps.length}
              {!isLastStep && " · " + (photosCount - 1) + " fotos tomadas"}
            </p>

            <Card className="p-6">
              <CardContent className="p-0">
                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#C2E09D] flex items-center justify-center">
                    <Camera className="w-5 h-5 text-[#2F3A2D]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-[#2F3A2D]">{slot.label}</h2>
                    <p className="text-xs text-[#64705E]">{photosCount}/{photoSteps.length} fotos · {!isLastStep ? totalRequired + " obligatorias" : "Opcional"}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[#64705E] mb-4">{slot.description}</p>

                {/* Tip */}
                <div className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-[#F0F5EC]">
                  <Sun className="w-4 h-4 text-[#C2E09D] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#64705E]">{slot.tip}</p>
                </div>

                {/* Visual example hint */}
                <div className="p-4 mb-5 rounded-2xl border border-dashed border-[#DDE7D3] bg-[#F8FAF5]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#ECFFD3] flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-[#2F3A2D]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#2F3A2D]">Ejemplo visual</p>
                      <p className="text-[10px] text-[#64705E]">{slot.exampleLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Photo upload area */}
                {hasPhoto ? (
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#DDE7D3] mb-5">
                    <Image
                      src={currentPhoto.preview!}
                      alt={slot.label}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => removePhoto(slot.id)}
                        className="text-xs bg-white/90 text-[#64705E] px-3 py-1.5 rounded-full border border-[#DDE7D3] shadow-sm hover:bg-white"
                        aria-label="Quitar foto"
                      >
                        Quitar foto
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="text-xs bg-white/90 text-[#2F3A2D] px-3 py-1 rounded-full border border-[#DDE7D3] font-medium">
                        <CheckCircle2 className="w-3 h-3 inline mr-1 text-[#C2E09D]" />
                        Foto aceptada
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#DDE7D3] hover:border-[#C2E09D] transition-all flex flex-col items-center justify-center gap-2 bg-[#F8FAF5] hover:bg-[#F0F5EC] mb-5"
                    aria-label={`Subir ${slot.label}`}
                  >
                    <Upload className="w-8 h-8 text-[#8A9A82]" />
                    <span className="text-sm text-[#8A9A82]">Toca para tomar o subir foto</span>
                    <span className="text-[10px] text-[#8A9A82]">JPG, PNG · Máx 10MB</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handlePhoto(slot.id, file)
                    }
                    e.target.value = ""
                  }}
                />

                {/* Navigation */}
                <div className="flex gap-3">
                  {isFirstStep ? (
                    <Button variant="ghost" onClick={() => setStep("consent")} className="flex-1">
                      <ChevronLeft className="w-4 h-4 mr-1.5" />
                      Atrás
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentPhotoStep((p) => Math.max(0, p - 1))}
                      className="flex-1"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1.5" />
                      Anterior
                    </Button>
                  )}

                  {isLastStep ? (
                    <Button
                      onClick={() => {
                        if (requiredPhotosDone) {
                          setStep("questions")
                        } else {
                          setError("Las fotos frontal, perfil izquierdo y perfil derecho son obligatorias.")
                        }
                      }}
                      disabled={!requiredPhotosDone}
                      variant="primary"
                      className="flex-1 py-5 h-auto"
                    >
                      {requiredPhotosDone ? "Continuar" : "Faltan fotos obligatorias"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (hasPhoto || slot.id === "closeup") {
                          setCurrentPhotoStep((p) => Math.min(photoSteps.length - 1, p + 1))
                        } else {
                          setError(`Toma la foto ${slot.label.toLowerCase()} antes de continuar.`)
                        }
                      }}
                      variant="primary"
                      className="flex-1 py-5 h-auto"
                    >
                      {hasPhoto ? "Siguiente" : "Saltar (opcional)"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Step 3: Questions ─── */}
        {step === "questions" && (
          <Card className="p-6 animate-fade-in-up">
            <CardContent className="p-0 space-y-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-[#2F3A2D]">
                  <User className="w-4 h-4 text-[#2F3A2D]" />
                  Edad
                </label>
                <select
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-xl border border-[#DDE7D3] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] text-[#2F3A2D]"
                >
                  <option value="">Selecciona...</option>
                  {["<18", "18-24", "25-30", "31-40", "41-50", "51+"].map((a) => (
                    <option key={a} value={a}>{a} años</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-[#2F3A2D]">
                  <User className="w-4 h-4 text-[#2F3A2D]" />
                  Sexo
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-[#DDE7D3] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] text-[#2F3A2D]"
                >
                  <option value="">Selecciona...</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-[#2F3A2D]">
                  <MapPin className="w-4 h-4 text-[#2F3A2D]" />
                  Clima donde vives
                </label>
                <select
                  value={climate}
                  onChange={(e) => setClimate(e.target.value)}
                  className="w-full rounded-xl border border-[#DDE7D3] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] text-[#2F3A2D]"
                >
                  <option value="">Selecciona...</option>
                  <option value="tropical">Tropical (cálido/húmedo)</option>
                  <option value="seco">Seco/Árido</option>
                  <option value="templado">Templado</option>
                  <option value="frio">Frío</option>
                  <option value="humedo">Húmedo</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-[#2F3A2D]">
                  <Droplets className="w-4 h-4 text-[#2F3A2D]" />
                  Principales preocupaciones
                </label>
                <textarea
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  placeholder="Ej: manchas, arrugas, ojeras, piel opaca, poros abiertos, textura irregular..."
                  className="w-full rounded-xl border border-[#DDE7D3] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] min-h-[80px] resize-none text-[#2F3A2D] placeholder:text-[#8A9A82]"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-[#2F3A2D]">
                  <ClipboardList className="w-4 h-4 text-[#2F3A2D]" />
                  Rutina actual (opcional)
                </label>
                <textarea
                  value={routine}
                  onChange={(e) => setRoutine(e.target.value)}
                  placeholder="Ej: lavo mi cara con jabón neutro y uso crema hidratante en las mañanas..."
                  className="w-full rounded-xl border border-[#DDE7D3] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#C2E09D] min-h-[80px] resize-none text-[#2F3A2D] placeholder:text-[#8A9A82]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep("photos")} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Atrás
                </Button>
                <Button
                  onClick={handleAnalyze}
                  variant="primary"
                  className="flex-1 py-5 h-auto"
                  disabled={!requiredPhotosDone || status === "loading"}
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Observar mi piel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Step 4: Analyzing ─── */}
        {step === "analyzing" && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="w-24 h-24 rounded-full bg-[#C2E09D] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#2F3A2D] animate-spin" />
              </div>
            </div>
            <h2 className="font-serif text-xl font-semibold mb-2 text-[#2F3A2D]">
              Analizando tus fotos...
            </h2>
            <p className="text-sm text-[#64705E] max-w-sm mx-auto">
              Estamos examinando las características visibles desde múltiples ángulos.
              Esto toma solo unos segundos.
            </p>
            <div className="mt-8 max-w-xs mx-auto h-1 rounded-full bg-[#F0F5EC] overflow-hidden" role="progressbar" aria-label="Progreso del análisis">
              <div className="h-full w-1/3 rounded-full bg-[#C2E09D] animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
