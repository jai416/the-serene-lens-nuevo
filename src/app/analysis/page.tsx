"use client"

import { useState, useRef, useCallback } from "react"
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
} from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { compressImage } from "@/lib/image-compression"

type Step = "consent" | "photos" | "questions" | "analyzing" | "done"

interface PhotoSlot {
  id: string
  label: string
  file: File | null
  preview: string | null
}

const photoSlots: Omit<PhotoSlot, "file" | "preview">[] = [
  { id: "front", label: "Frontal" },
  { id: "left", label: "Perfil izquierdo" },
  { id: "right", label: "Perfil derecho" },
  { id: "closeup1", label: "Frente" },
  { id: "closeup2", label: "Mejillas" },
  { id: "closeup3", label: "Nariz" },
]

export default function AnalysisPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState<Step>("consent")
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    photoSlots.map((slot) => ({ ...slot, file: null, preview: null }))
  )
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [climate, setClimate] = useState("")
  const [concerns, setConcerns] = useState("")
  const [routine, setRoutine] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activePhotoSlot, setActivePhotoSlot] = useState<string | null>(null)

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
      const compressed = await compressImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === slotId ? { ...p, file: compressed, preview: e.target?.result as string } : p
          )
        )
      }
      reader.readAsDataURL(compressed)
    } catch {
      setError("Error al procesar la imagen")
    }
  }, [])

  const removePhoto = (slotId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === slotId ? { ...p, file: null, preview: null } : p))
    )
  }

  const allPhotosDone = photos.every((p) => p.file !== null)
  const photosCount = photos.filter((p) => p.file !== null).length

  const handleAnalyze = async () => {
    if (!allPhotosDone || !session) return
    setStep("analyzing")

    const formData = new FormData()
    photos.forEach((p) => {
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
        throw new Error(data.error || "Error al analizar")
      }

      const data = await res.json()
      setStep("done")
      router.push(`/analysis/results/${data.analysis.id}`)
    } catch (e: any) {
      setError(e.message || "Error al analizar las imágenes")
      setStep("questions")
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="neon" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Scan className="w-3.5 h-3.5 mr-2" />
            Observación de Piel
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2">
            Conoce tu <span className="gradient-text">Piel</span>
          </h1>
          <p className="text-on-surface-variant">Completa los pasos para recibir observaciones cosméticas personalizadas.</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {["consent", "photos", "questions"].map((s, i) => {
            const isDone =
              (s === "consent" && consentAccepted) ||
              (s === "photos" && allPhotosDone) ||
              (s === "questions" && step === "analyzing")
            const isCurrent = step === s
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-[rgba(183,255,42,0.2)] text-primary border border-primary"
                        : "bg-[rgba(255,255,255,0.06)] text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-px ${isDone ? "bg-primary" : "bg-[rgba(255,255,255,0.1)]"}`} />}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Step 1: Consent ─── */}
        {step === "consent" && (
          <Card className="p-8 border-[rgba(255,255,255,0.25)] animate-fade-in-up">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold">Aviso Legal</h2>
                  <p className="text-sm text-on-surface-variant">Información importante antes de comenzar</p>
                </div>
              </div>

              <div className="text-sm text-on-surface-variant leading-relaxed p-4 rounded-2xl bg-[rgba(255,255,255,0.04)] mb-6">
                <p>
                  Esta herramienta realiza observaciones cosméticas y educativas basadas únicamente en fotografías
                  y la información proporcionada por el usuario.
                </p>
                <p className="mt-3">
                  No diagnostica enfermedades, no sustituye a dermatólogos ni profesionales de la salud y no debe
                  utilizarse como herramienta médica.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[rgba(255,255,255,0.25)] bg-transparent accent-primary"
                />
                <span className="text-sm text-on-surface-variant">
                  He leído y acepto los términos. Entiendo que esta herramienta no reemplaza una consulta profesional.
                </span>
              </label>

              <div className="mt-6">
                <Button
                  onClick={() => setStep("photos")}
                  disabled={!consentAccepted}
                  variant="neon"
                  className="w-full py-5 h-auto"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Step 2: Photos ─── */}
        {step === "photos" && (
          <div className="animate-fade-in-up space-y-4">
            <Card className="p-6 border-[rgba(255,255,255,0.25)]">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold">Fotos de tu rostro</h2>
                    <p className="text-xs text-on-surface-variant">{photosCount} de 6 fotos</p>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant mb-4 px-0.5">
                  Las diferentes perspectivas ayudan a identificar mejor características visibles de la piel como
                  brillo, textura, uniformidad y apariencia general.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((slot) => (
                    <div key={slot.id} className="relative">
                      {slot.preview ? (
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.15)] group">
                          <Image
                            src={slot.preview}
                            alt={slot.label}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => removePhoto(slot.id)}
                              className="text-xs text-destructive bg-black/50 px-3 py-1 rounded-full"
                            >
                              Quitar
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                            <span className="text-[10px] text-white/80">{slot.label}</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActivePhotoSlot(slot.id)
                            fileInputRef.current?.click()
                          }}
                          className="aspect-[3/4] rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.15)] hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-1.5 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(183,255,42,0.03)]"
                        >
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground text-center px-1">{slot.label}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && activePhotoSlot) {
                      handlePhoto(activePhotoSlot, file)
                    }
                    e.target.value = ""
                  }}
                />

                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setStep("consent")} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1.5" />
                    Atrás
                  </Button>
                  <Button
                    onClick={() => setStep("questions")}
                    disabled={!allPhotosDone}
                    variant="neon"
                    className="flex-1 py-5 h-auto"
                  >
                    Continuar
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Step 3: Questions ─── */}
        {step === "questions" && (
          <Card className="p-6 border-[rgba(255,255,255,0.25)] animate-fade-in-up">
            <CardContent className="p-0 space-y-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Edad
                </label>
                <select
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                >
                  <option value="">Selecciona...</option>
                  {["<18", "18-24", "25-30", "31-40", "41-50", "51+"].map((a) => (
                    <option key={a} value={a}>{a} años</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Sexo
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                >
                  <option value="">Selecciona...</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Clima donde vives
                </label>
                <select
                  value={climate}
                  onChange={(e) => setClimate(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
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
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-primary" />
                  Principales preocupaciones
                </label>
                <textarea
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  placeholder="Ej: manchas, arrugas, ojeras, piel opaca, poros abiertos, textura irregular..."
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none text-on-surface placeholder:text-muted-foreground/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Rutina actual (opcional)
                </label>
                <textarea
                  value={routine}
                  onChange={(e) => setRoutine(e.target.value)}
                  placeholder="Ej: lavo mi cara con jabón neutro y uso crema hidratante en las mañanas..."
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none text-on-surface placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep("photos")} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Atrás
                </Button>
                <Button
                  onClick={handleAnalyze}
                  variant="neon"
                  className="flex-1 py-5 h-auto"
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
              <div className="absolute inset-0 rounded-full gradient-primary flex items-center justify-center neon-glow-strong animate-neon-pulse">
                <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
              </div>
            </div>
            <h2 className="font-serif text-xl font-semibold mb-2">
              Analizando tus fotos...
            </h2>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
              Estamos examinando las características visibles desde múltiples ángulos.
              Esto toma solo unos segundos.
            </p>
            <div className="mt-8 max-w-xs mx-auto h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
