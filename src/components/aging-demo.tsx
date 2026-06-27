"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Lock, Sparkles, Camera, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { validatePhoto, type PhotoQualityResult } from "@/lib/photo-quality"
import { compressImage } from "@/lib/image-compression"

interface Scores {
  hydration: number
  texture: number
  firmness: number
  luminosity: number
}

function AnimatedBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#2F3A2D] dark:text-[#E8EDE6]">{label}</span>
        <span className="font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">{value}/100</span>
      </div>
      <div className="h-3 bg-[#E8EDE4] dark:bg-[#2E3829] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#C2E09D] to-[#A8CC82] rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export function AgingDemo() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState<Scores | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qualityIssues, setQualityIssues] = useState<PhotoQualityResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setScores(null)
    setError(null)
    setQualityIssues(null)

    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    const quality = await validatePhoto(file)
    setQualityIssues(quality)
  }

  const handleSubmit = async () => {
    if (!photo) return
    setLoading(true)
    setError(null)
    try {
      const compressed = await compressImage(photo)
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(compressed)
      })

      const res = await fetch("/api/aging-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      const data = await res.json()
      if (data.success && data.data?.scores) {
        setScores(data.data.scores)
      } else {
        setError(data.error || "No se pudo procesar la imagen. Intenta con otra foto.")
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <span className="inline-flex items-center gap-2 bg-[#C2E09D]/20 text-[#2F3A2D] dark:text-[#C2E09D] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Prueba Rápida — Sin registro
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2F3A2D] dark:text-[#E8EDE6] mb-3">
          Mira qué dice la IA de tu piel
        </h2>
        <p className="text-[#64705E] dark:text-[#9BAA93]">
          Sube una foto y obtén gráficas visuales al instante. Sin compromiso.
        </p>
      </div>

      <Card className="max-w-lg mx-auto bg-white dark:bg-[#222920] border-[#E8EDE4] dark:border-[#3A4536]">
        <CardContent className="p-6">
          {!scores ? (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#DDE7D3] dark:border-[#3A4536] rounded-xl p-8 text-center cursor-pointer hover:border-[#C2E09D] transition-colors"
              >
                {preview ? (
                  <img src={preview} alt="Vista previa" className="w-32 h-32 object-cover rounded-lg mx-auto mb-3" />
                ) : (
                  <Camera className="w-10 h-10 text-[#8A9A82] dark:text-[#7A8A72] mx-auto mb-3" />
                )}
                <p className="text-sm text-[#64705E] dark:text-[#9BAA93]">
                  {photo ? photo.name : "Toca para subir una foto frontal"}
                </p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </div>

              {qualityIssues && !qualityIssues.pass && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {!qualityIssues.face.detected ? qualityIssues.face.message : "La foto no cumple los requisitos de calidad."}
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!photo || loading}
                className="w-full mt-4 py-3 bg-[#2F3A2D] text-white rounded-xl font-medium hover:bg-[#3A4A38] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Analizar mi piel gratis</>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-4">Tus resultados:</h3>
                <AnimatedBar label="Hidratación" value={scores.hydration} delay={0} />
                <AnimatedBar label="Textura" value={scores.texture} delay={200} />
                <AnimatedBar label="Firmeza" value={scores.firmness} delay={400} />
                <AnimatedBar label="Luminosidad" value={scores.luminosity} delay={600} />
              </div>

              <div className="relative">
                <div className="blur-sm pointer-events-none opacity-60">
                  <div className="p-4 bg-[#F8FAF5] dark:bg-[#1E251C] rounded-xl mb-3">
                    <p className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">Recomendaciones personalizadas</p>
                    <p className="text-xs text-[#64705E] dark:text-[#9BAA93] mt-1">Basadas en tu tipo de piel y análisis completo...</p>
                  </div>
                  <div className="p-4 bg-[#F8FAF5] dark:bg-[#1E251C] rounded-xl">
                    <p className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">Rutina dinámica para tu piel</p>
                    <p className="text-xs text-[#64705E] dark:text-[#9BAA93] mt-1">Morning routine: limpiador, sérum, hidratante...</p>
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-white/80 to-white dark:via-[#222920]/80 dark:to-[#222920]">
                  <Lock className="w-8 h-8 text-[#C2E09D] mb-2" />
                  <p className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6] text-center px-4">
                    Desbloquea tu rutina y recomendaciones
                  </p>
                  <Link href="/login?ref=demo">
                    <button className="mt-3 px-6 py-2 bg-[#C2E09D] text-[#2F3A2D] rounded-full text-sm font-semibold hover:bg-[#B0D48E] transition-colors">
                      Crear cuenta gratis
                    </button>
                  </Link>
                </div>
              </div>

              <p className="text-[10px] text-[#8A9A82] dark:text-[#7A8A72] text-center mt-4">
                Observación cosmética, no diagnóstico médico
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
