"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Scan, Camera, Loader2, AlertCircle, CheckCircle2, Shield, User, ArrowLeft, ArrowRight,
  Droplets, ClipboardList, Trash2, Sparkles,
} from "lucide-react"
import WebcamCapture from "@/components/webcam-capture"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { compressImage } from "@/lib/image-compression"
import { validatePhoto } from "@/lib/photo-quality"
import { getPhotoSteps } from "@/lib/photo-steps"
import { getCsrfToken } from "@/lib/csrf-client"
import { trackAnalysisStarted, trackAnalysisPhotoUploaded, trackAnalysisAbandoned } from "@/lib/tracking"
import Link from "next/link"
const photoSteps = getPhotoSteps()
const STORAGE_KEY = "tsl_analysis_draft"

const STEPS = [
  { id: "consent", label: "Consentimiento" },
  { id: "photos", label: "Fotos" },
  { id: "data", label: "Datos" },
  { id: "review", label: "Analizar" },
] as const
type StepId = (typeof STEPS)[number]["id"]

function loadDraft() {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveDraft(data: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export default function AnalysisPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const draft = loadDraft()
  const [step, setStep] = useState<StepId>("consent")
  const [consentAccepted, setConsentAccepted] = useState(draft?.consentAccepted === "true")
  const initialPhotos = Object.fromEntries(
    photoSteps.map((s) => [s.id, { file: null as File | null, preview: null as string | null }])
  )
  const [photos, setPhotos] = useState<Record<string, { file: File | null; preview: string | null }>>(initialPhotos)
  const [age, setAge] = useState(draft?.age || "")
  const [gender, setGender] = useState(draft?.gender || "")
  const [climate, setClimate] = useState(draft?.climate || "")
  const [concerns, setConcerns] = useState(draft?.concerns || "")
  const [routine, setRoutine] = useState(draft?.routine || "")
  const [error, setError] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activePhotoSlot, setActivePhotoSlot] = useState<string | null>(null)
  const [webcamSlot, setWebcamSlot] = useState<string | null>(null)
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasTrackedStart = useRef(false)
  const abandonTracked = useRef(false)

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const currentStep = step

  const goNext = () => {
    const idx = STEPS.findIndex((s) => s.id === currentStep)
    if (idx < STEPS.length - 1) {
      setDirection("forward")
      setStep(STEPS[idx + 1].id)
    }
  }

  const goBack = () => {
    const idx = STEPS.findIndex((s) => s.id === currentStep)
    if (idx > 0) {
      setDirection("backward")
      setStep(STEPS[idx - 1].id)
    }
  }

  const handlePhoto = useCallback(async (slotId: string, file: File) => {
    if (!file.type.startsWith("image/")) { setError("Por favor selecciona una imagen válida"); return }
    if (file.size > 10 * 1024 * 1024) { setError("La imagen no debe superar los 10MB"); return }
    setError("")
    try {
      const quality = await validatePhoto(file)
      if (!quality.pass) {
        const reasons: string[] = []
        if (!quality.blur.pass) reasons.push("Foto muy borrosa")
        if (!quality.brightness.pass) reasons.push(quality.brightness.value < 40 ? "Foto muy oscura" : "Foto muy sobreexpuesta")
        setError(reasons.join(". ") + ". Toma una foto con mejor iluminación y enfoca bien.")
        trackAnalysisPhotoUploaded(photoSteps.findIndex((s) => s.id === slotId) + 1, false); return
      }
      trackAnalysisPhotoUploaded(photoSteps.findIndex((s) => s.id === slotId) + 1, true)
      const compressed = await compressImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos((prev) => ({ ...prev, [slotId]: { file: compressed, preview: e.target?.result as string } }))
      }
      reader.readAsDataURL(compressed)
    } catch { setError("Error al procesar la imagen") }
  }, [])

  const handleWebcamCapture = useCallback((blob: Blob) => {
    if (!webcamSlot) return
    const file = new File([blob], `webcam-${webcamSlot}-${Date.now()}.jpg`, { type: "image/jpeg" })
    handlePhoto(webcamSlot, file)
    setWebcamSlot(null)
  }, [webcamSlot, handlePhoto])

  const openWebcam = (slotId: string) => setWebcamSlot(slotId)

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveDraft({ consentAccepted: String(consentAccepted), age, gender, climate, concerns, routine })
    }, 500)
    return () => clearTimeout(timeout)
  }, [consentAccepted, age, gender, climate, concerns, routine])

  const removePhoto = (slotId: string) => setPhotos((prev) => ({ ...prev, [slotId]: { file: null, preview: null } }))

  const requiredPhotosDone = photoSteps.length === 2
    ? photos.front.file !== null && photos.side.file !== null
    : photos.front.file !== null && photos.left.file !== null && photos.right.file !== null
  const photosCount = Object.values(photos).filter((p) => p.file !== null).length

  const handleAnalyze = async () => {
    if (!requiredPhotosDone) return
    if (!session) { router.push("/login?callbackUrl=/analysis"); return }
    setIsAnalyzing(true)
    if (!hasTrackedStart.current) { hasTrackedStart.current = true; trackAnalysisStarted() }

    const formData = new FormData()
    Object.entries(photos).forEach(([id, p]) => { if (p.file) formData.append("photos", p.file) })
    formData.append("age", age); formData.append("gender", gender)
    formData.append("climate", climate); formData.append("concerns", concerns); formData.append("routine", routine)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "x-csrf-token": getCsrfToken() }, body: formData,
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error?.message || d.error || "Error al analizar") }
      const data = await res.json()
      clearDraft()
      router.push(`/analysis/results/${data.analysis.id}`)
    } catch (e: any) {
      setError(e.message || "Error al analizar las imágenes")
      setIsAnalyzing(false)
    }
  }

  const handleTriggerUpload = (slotId: string) => { setActivePhotoSlot(slotId); fileInputRef.current?.click() }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && activePhotoSlot) { handlePhoto(activePhotoSlot, file) }
    e.target.value = ""; setActivePhotoSlot(null)
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }
  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault(); e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handlePhoto(slotId, file)
  }

  const canGoNext = () => {
    if (currentStep === "consent") return consentAccepted
    if (currentStep === "photos") return requiredPhotosDone
    if (currentStep === "data") return age !== "" && gender !== "" && climate !== ""
    return true
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F8F9FA" }}>
        <Card className="max-w-md w-full" style={{ borderRadius: "20px", borderColor: "#E8E8E8" }}>
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#88B078" }}>
              <User className="w-7 h-7" style={{ color: "#1A1A1A" }} />
            </div>
            <h2 className="font-serif text-xl font-semibold mb-2" style={{ color: "#1A1A1A" }}>Inicia sesión para continuar</h2>
            <p className="text-sm mb-6" style={{ color: "#666666" }}>Necesitas una cuenta para realizar análisis y guardar tu historial de piel.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login?callbackUrl=/analysis"><Button variant="primary" className="px-8">Iniciar sesión</Button></Link>
              <Link href="/login?callbackUrl=/analysis"><Button variant="secondary" className="px-8">Crear cuenta gratis</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FA" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Scan className="w-3.5 h-3.5 mr-2" />
            Análisis de Piel
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2" style={{ color: "#1A1A1A" }}>
            Conoce tu Piel
          </h1>
          <p style={{ color: "#666666" }}>Completa los pasos para recibir observaciones cosméticas personalizadas.</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  stepIndex >= i ? "bg-[#88B078] text-[#1A1A1A]" : "bg-[#E8E8E8] text-[#666666]"
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: stepIndex >= i ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)" }}
                >
                  {stepIndex > i ? "✓" : i + 1}
                </span>
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 ${stepIndex > i ? "bg-[#88B078]" : "bg-[#E8E8E8]"}`} />
              )}
            </div>
          ))}
        </div>

        {error && !isAnalyzing && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#E07070" }} />
            <span className="text-sm" style={{ color: "#E07070" }}>{error}</span>
          </div>
        )}

        {!isAnalyzing ? (
          <div className="space-y-6">
            {/* ─── STEP 1: Consentimiento ─── */}
            {currentStep === "consent" && (
              <section className="bg-white rounded-[20px] border p-6 animate-fadeIn" style={{ borderColor: "#E8E8E8" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#88B078" }}>
                    <Shield className="w-5 h-5" style={{ color: "#1A1A1A" }} />
                  </div>
                  <h2 className="font-serif text-lg font-semibold" style={{ color: "#1A1A1A" }}>Consentimiento</h2>
                </div>

                <div className="text-sm leading-relaxed mb-4 p-4 rounded-xl" style={{ color: "#666666", backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8" }}>
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
                    style={{ accentColor: "#88B078", borderColor: "#E8E8E8" }}
                  />
                  <span className="text-sm" style={{ color: "#666666" }}>
                    He leído y acepto los términos. Entiendo que esta herramienta no reemplaza una consulta profesional.
                  </span>
                </label>

                <div className="flex justify-end mt-6">
                  <Button onClick={goNext} disabled={!consentAccepted} variant="primary" className="px-8">
                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </section>
            )}

            {/* ─── STEP 2: Fotos ─── */}
            {currentStep === "photos" && (
              <section className="bg-white rounded-[20px] border p-6 animate-fadeIn" style={{ borderColor: "#E8E8E8" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#88B078" }}>
                    <Camera className="w-5 h-5" style={{ color: "#1A1A1A" }} />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold" style={{ color: "#1A1A1A" }}>Fotos</h2>
                    <p className="text-xs" style={{ color: "#666666" }}>{photosCount}/{photoSteps.length} fotos</p>
                  </div>
                </div>

                <div className="text-sm text-[#666666] bg-[#E2ECE0] p-4 rounded-xl mb-4">
                  Toma tus fotos en un lugar bien iluminado, sin filtros ni maquillaje. La IA analizará textura, poros, hidratación y más.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {photoSteps.map((slot) => {
                    const photo = photos[slot.id]
                    const hasPhoto = photo?.file !== null
                    return (
                      <div key={slot.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, slot.id)}>
                        {hasPhoto ? (
                          <div className="relative aspect-square rounded-xl overflow-hidden" style={{ border: "1px solid #E8E8E8" }}>
                            <Image src={photo.preview!} alt={slot.label} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                            <button onClick={() => removePhoto(slot.id)}
                              className="absolute top-2 right-2 text-xs px-2.5 py-1.5 rounded-full shadow-sm backdrop-blur-sm"
                              style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#666666", border: "1px solid #E8E8E8" }}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-2 left-2 text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm"
                              style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#1A1A1A", border: "1px solid #E8E8E8" }}>
                              <CheckCircle2 className="w-3 h-3 inline mr-1" style={{ color: "#88B078" }} />
                              {slot.label}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <button onClick={() => handleTriggerUpload(slot.id)}
                              className="w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all hover:opacity-80"
                              style={{ borderColor: "#E8E8E8", backgroundColor: "#F8F9FA" }}>
                              <Camera className="w-6 h-6" style={{ color: "#666666" }} />
                              <span className="text-xs font-medium" style={{ color: "#666666" }}>Agregar</span>
                              <span className="text-[10px]" style={{ color: "#666666" }}>{slot.label}</span>
                            </button>
                            <button onClick={() => openWebcam(slot.id)}
                              className="w-full text-xs py-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
                              style={{ borderColor: "#88B078", color: "#88B078", backgroundColor: "#E2ECE0" }}>
                              <Camera className="w-3.5 h-3.5" /> Cámara
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                <div className="flex justify-between mt-6">
                  <Button onClick={goBack} variant="outline" className="px-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                  </Button>
                  <Button onClick={goNext} disabled={!requiredPhotosDone} variant="primary" className="px-8">
                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </section>
            )}

            {/* ─── STEP 3: Datos ─── */}
            {currentStep === "data" && (
              <section className="bg-white rounded-[20px] border p-6 animate-fadeIn" style={{ borderColor: "#E8E8E8" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#88B078" }}>
                    <User className="w-5 h-5" style={{ color: "#1A1A1A" }} />
                  </div>
                  <h2 className="font-serif text-lg font-semibold" style={{ color: "#1A1A1A" }}>Sobre ti</h2>
                </div>

                <div className="text-sm text-[#666666] bg-[#F8F9FA] p-4 rounded-xl mb-4" style={{ border: "1px solid #E8E8E8" }}>
                  Estos datos ayudan a la IA a personalizar mejor las recomendaciones. Toda la información es anónima.
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: "#1A1A1A" }}>Edad</label>
                    <select value={age} onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#88B078] appearance-none"
                      style={{ border: "1px solid #E8E8E8", backgroundColor: "white", color: "#1A1A1A" }}>
                      <option value="">Selecciona</option>
                      {["<18", "18-24", "25-30", "31-40", "41-50", "51+"].map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: "#1A1A1A" }}>Sexo</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#88B078] appearance-none"
                      style={{ border: "1px solid #E8E8E8", backgroundColor: "white", color: "#1A1A1A" }}>
                      <option value="">Selecciona</option>
                      <option value="femenino">Femenino</option>
                      <option value="masculino">Masculino</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block" style={{ color: "#1A1A1A" }}>Clima</label>
                    <select value={climate} onChange={(e) => setClimate(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#88B078] appearance-none"
                      style={{ border: "1px solid #E8E8E8", backgroundColor: "white", color: "#1A1A1A" }}>
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
                    <label className="text-sm font-medium mb-1.5 block flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                      <Droplets className="w-4 h-4" style={{ color: "#666666" }} />
                      Principales preocupaciones
                    </label>
                    <textarea value={concerns} onChange={(e) => setConcerns(e.target.value)}
                      placeholder="Ej: manchas, arrugas, ojeras, piel opaca, poros abiertos..."
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#88B078] min-h-[80px] resize-none placeholder-[#666666]"
                      style={{ border: "1px solid #E8E8E8", backgroundColor: "white", color: "#1A1A1A" }} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                      <ClipboardList className="w-4 h-4" style={{ color: "#666666" }} />
                      Rutina actual
                    </label>
                    <textarea value={routine} onChange={(e) => setRoutine(e.target.value)}
                      placeholder="Ej: lavo mi cara con jabón neutro y uso crema hidratante..."
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#88B078] min-h-[80px] resize-none placeholder-[#666666]"
                      style={{ border: "1px solid #E8E8E8", backgroundColor: "white", color: "#1A1A1A" }} />
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button onClick={goBack} variant="outline" className="px-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                  </Button>
                  <Button onClick={goNext} disabled={!age || !gender || !climate} variant="primary" className="px-8">
                    Revisar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </section>
            )}

            {/* ─── STEP 4: Revisar y Analizar ─── */}
            {currentStep === "review" && (
              <section className="bg-white rounded-[20px] border p-6 animate-fadeIn" style={{ borderColor: "#E8E8E8" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#88B078" }}>
                    <Sparkles className="w-5 h-5" style={{ color: "#1A1A1A" }} />
                  </div>
                  <h2 className="font-serif text-lg font-semibold" style={{ color: "#1A1A1A" }}>Revisar y Analizar</h2>
                </div>

                {/* Resumen fotos */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {photoSteps.map((slot) => {
                    const photo = photos[slot.id]
                    return (
                      <div key={slot.id} className="aspect-square rounded-xl overflow-hidden relative"
                        style={{ border: "1px solid #E8E8E8", backgroundColor: "#F8F9FA" }}>
                        {photo?.file ? (
                          <Image src={photo.preview!} alt={slot.label} fill className="object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-[10px]" style={{ color: "#666666" }}>
                            Sin foto
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm"
                          style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#1A1A1A" }}>
                          {slot.label}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Resumen datos */}
                <div className="text-sm space-y-2 mb-6 p-4 rounded-xl" style={{ backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8" }}>
                  <p><span style={{ color: "#666666" }}>Edad:</span> <span style={{ color: "#1A1A1A" }}>{age || "—"}</span></p>
                  <p><span style={{ color: "#666666" }}>Sexo:</span> <span style={{ color: "#1A1A1A" }}>{gender || "—"}</span></p>
                  <p><span style={{ color: "#666666" }}>Clima:</span> <span style={{ color: "#1A1A1A" }}>{climate || "—"}</span></p>
                  {concerns && <p><span style={{ color: "#666666" }}>Preocupaciones:</span> <span style={{ color: "#1A1A1A" }}>{concerns}</span></p>}
                  {routine && <p><span style={{ color: "#666666" }}>Rutina:</span> <span style={{ color: "#1A1A1A" }}>{routine}</span></p>}
                </div>

                <div className="flex justify-between">
                  <Button onClick={goBack} variant="outline" className="px-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                  </Button>
                  <button
                    onClick={handleAnalyze}
                    className="inline-flex items-center justify-center px-10 py-4 rounded-[20px] font-semibold text-base transition-all shadow-[0_4px_16px_rgba(136,176,120,0.25)] hover:shadow-[0_8px_24px_rgba(136,176,120,0.35)]"
                    style={{ backgroundColor: "#88B078", color: "#1A1A1A" }}
                  >
                    <Scan className="w-5 h-5 mr-2" />
                    Analizar mi piel
                  </button>
                </div>
              </section>
            )}
          </div>
        ) : (
          /* ─── Analyzing State ─── */
          <div className="text-center py-16">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "#88B078" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#1A1A1A" }} />
              </div>
            </div>
            <h2 className="font-serif text-xl font-semibold mb-2" style={{ color: "#1A1A1A" }}>
              Analizando tus fotos...
            </h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "#666666" }}>
              Estamos examinando las características visibles desde múltiples ángulos. Esto toma solo unos segundos.
            </p>
            <div className="mt-8 max-w-xs mx-auto h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#E8E8E8" }}
              role="progressbar" aria-label="Progreso del análisis">
              <div className="h-full w-1/3 rounded-full animate-pulse" style={{ backgroundColor: "#88B078" }} />
            </div>
          </div>
        )}

        {webcamSlot && <WebcamCapture onCapture={handleWebcamCapture} onClose={() => setWebcamSlot(null)} />}
      </div>
    </div>
  )
}
