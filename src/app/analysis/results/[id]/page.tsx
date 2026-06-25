"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Scan,
  ArrowLeft,
  Sun,
  Moon,
  CheckCircle2,
  Eye,
  AlertCircle,
  FileText,
  Droplets,
  Sparkles,
  Clock,
  ShoppingBag,
  Info,
  History,
  Leaf,
  ThumbsUp,
  ThumbsDown,
  Share2,
} from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { toast } from "sonner"
import { SatisfactionSurvey } from "@/components/satisfaction-survey"

interface AIResult {
  skinType: string
  texture: string
  pores: string
  shine: string
  uniformity: string
  apparentSensitivity: string
  apparentOil: string
  observations: string[]
  observationExplanations?: Record<string, string>
  recommendations: string[]
  confidence: string
  confidenceReason?: string
  routine: {
    morning: string[]
    evening: string[]
  }
}

interface AnalysisData {
  id: string
  userId: string | null
  skinType: string | null
  concerns: string | null
  observations: string
  recommendations: string
  routine: string | null
  createdAt: string
}

const severityLabels = [
  { value: "bajo", label: "Bajo", color: "bg-[#C2E09D] text-[#2F3A2D]" },
  { value: "moderado", label: "Moderado", color: "bg-[#FFF6AD] text-[#2F3A2D]" },
  { value: "visible", label: "Visible", color: "bg-[#FFF6AD] text-[#2F3A2D]" },
  { value: "leve", label: "Leve", color: "bg-[#ECFFD3] text-[#2F3A2D]" },
  { value: "alto", label: "Alto", color: "bg-[#C2E09D]/70 text-[#2F3A2D]" },
]

function getSeverityBadge(value: string) {
  const v = value?.toLowerCase() || ""
  const match = severityLabels.find((s) => s.value === v)
  if (match) {
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${match.color}`}>{match.label}</span>
  }
  return null
}

export default function AnalysisResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [result, setResult] = useState<AIResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const savedRef = useRef(false)

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analysis/${id}`)
        if (!res.ok) throw new Error("Not found")
        const data = await res.json()
        const analysisData = data?.data?.analysis || data.analysis
        setAnalysis(analysisData)
        const obs = JSON.parse(analysisData.observations || "{}")
        const parsed: AIResult = {
          skinType: obs.skinType || "",
          texture: obs.texture || "",
          pores: obs.pores || "",
          shine: obs.shine || "",
          uniformity: obs.uniformity || "",
          apparentSensitivity: obs.apparentSensitivity || "",
          apparentOil: obs.apparentOil || "",
          observations: obs.observations || JSON.parse(analysisData.observations || "[]"),
          observationExplanations: obs.observationExplanations || {},
          recommendations: JSON.parse(analysisData.recommendations || "[]"),
          confidence: obs.confidence || "media",
          confidenceReason: obs.confidenceReason || "",
          routine: JSON.parse(analysisData.routine || '{"morning":[],"evening":[]}'),
        }
        setResult(parsed)
      } catch {
        setAnalysis(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysis()
  }, [id])

  useEffect(() => {
    if (analysis && session && !loading && !savedRef.current && !analysis.userId) {
      savedRef.current = true
      fetch(`/api/analysis/${id}/save`, { method: "POST" })
        .then((res) => {
          if (!res.ok) throw new Error("Error al guardar")
          toast.success("Análisis guardado en tu historial")
        })
        .catch(() => toast.error("No se pudo guardar el análisis"))
    }
  }, [analysis, session, loading, id])

  const submitFeedback = async (type: string) => {
    if (!session) {
      router.push("/login?callbackUrl=" + encodeURIComponent(`/analysis/results/${id}`))
      return
    }
    setFeedbackSubmitting(true)
    try {
      const res = await fetch(`/api/analysis/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      if (res.ok) {
        setFeedback(type)
        toast.success("¡Gracias por tu opinión!")
      }
    } catch {
      toast.error("Error al enviar opinión")
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#C2E09D] flex items-center justify-center mx-auto mb-4">
            <Scan className="w-6 h-6 text-[#2F3A2D]" />
          </div>
          <p className="text-[#64705E]">Cargando resultados...</p>
        </div>
      </div>
    )
  }

  if (!analysis || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F5EC] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-[#64705E]" />
          </div>
          <h2 className="font-serif text-xl font-semibold mb-2 text-[#2F3A2D]">Análisis no encontrado</h2>
          <p className="text-[#64705E] text-sm mb-6">Este análisis no existe o ha sido eliminado.</p>
          <Link href="/analysis">
            <Button variant="primary">
              <Scan className="w-4 h-4 mr-2" />
              Nuevo análisis
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const createdAt = analysis.createdAt
    ? new Date(analysis.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  const allObservations: { label: string; value: string; badge: React.ReactNode }[] = []
  if (result.texture) allObservations.push({ label: "Textura facial", value: result.texture, badge: getSeverityBadge(result.texture) })
  if (result.shine) allObservations.push({ label: "Brillo facial", value: result.shine, badge: getSeverityBadge(result.shine) })
  if (result.pores) allObservations.push({ label: "Poros", value: result.pores, badge: getSeverityBadge(result.pores) })
  if (result.uniformity) allObservations.push({ label: "Uniformidad del tono", value: result.uniformity, badge: getSeverityBadge(result.uniformity) })
  if (result.apparentSensitivity) allObservations.push({ label: "Sensibilidad aparente", value: result.apparentSensitivity, badge: getSeverityBadge(result.apparentSensitivity) })
  if (result.apparentOil) allObservations.push({ label: "Grasa aparente", value: result.apparentOil, badge: getSeverityBadge(result.apparentOil) })

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* ─── Header ─── */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/analysis")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Nuevo análisis
          </Button>
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Eye className="w-3.5 h-3.5 mr-2" />
            Resultados de tu Observación
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2F3A2D]">
            Tu Análisis
          </h1>
          {createdAt && (
            <p className="text-sm text-[#64705E] mt-1">{createdAt}</p>
          )}
        </div>

        <div className="space-y-5">
          {/* ─── 1. Resumen General ─── */}
          <Card className="p-6 border-t-4 border-t-[#C2E09D]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-[#2F3A2D]">
                <FileText className="w-5 h-5 text-[#2F3A2D]" />
                Resumen General
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-[#64705E] leading-relaxed mb-4">
                Este análisis ofrece una descripción de las características visuales observadas en las
                fotografías proporcionadas. A continuación se detallan los hallazgos organizados por
                categorías.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[#F8FAF5]">
                  <p className="text-xs text-[#64705E] mb-1">Piel aparente</p>
                  <p className="text-sm font-medium capitalize text-[#2F3A2D]">{result.skinType || "No determinado"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F8FAF5]">
                  <p className="text-xs text-[#64705E] mb-1">Nivel de confianza</p>
                  <p className="text-sm font-medium capitalize text-[#2F3A2D]">{result.confidence}</p>
                  {result.confidenceReason && (
                    <p className="text-[10px] text-[#8A9A82] mt-1">{result.confidenceReason}</p>
                  )}
                </div>
                <div className="p-3 rounded-2xl bg-[#F8FAF5]">
                  <p className="text-xs text-[#64705E] mb-1">Factores observados</p>
                  <p className="text-sm font-medium text-[#2F3A2D]">{allObservations.length} categorías</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F8FAF5]">
                  <p className="text-xs text-[#64705E] mb-1">Recomendaciones</p>
                  <p className="text-sm font-medium text-[#2F3A2D]">{result.recommendations.length} sugerencias</p>
                </div>
              </div>
              <p className="text-[10px] text-[#8A9A82] mt-2">Basado únicamente en observaciones visuales de las fotografías.</p>
            </CardContent>
          </Card>

          {/* ─── 2. Tipo de Piel Observado ─── */}
          {result.skinType && (
            <Card className="p-6 border-t-4 border-t-[#ECFFD3]">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-[#2F3A2D]">
                  <Droplets className="w-5 h-5 text-[#2F3A2D]" />
                  Tipo de Piel Observado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 rounded-2xl bg-[#F8FAF5]">
                  <p className="text-base font-medium capitalize text-[#2F3A2D]">{result.skinType}</p>
                  <p className="text-xs text-[#64705E] mt-1">
                    Esta clasificación se basa en las características visuales aparentes en las fotografías.
                    Puede variar según la hora del día, estación del año y rutina de cuidado actual.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── 3. Observaciones Detectadas ─── */}
          <Card className="p-6 border-t-4 border-t-[#FFF6AD]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-[#2F3A2D]">
                <Eye className="w-5 h-5 text-[#2F3A2D]" />
                Observaciones Detectadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                {allObservations.length > 0 ? (
                  allObservations.map((obs, i) => {
                    const explanation = result.observationExplanations?.[obs.label] || result.observationExplanations?.[obs.value] || ""
                    return (
                      <div key={i} className="p-3 rounded-2xl bg-[#F8FAF5]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-[#64705E]">{obs.label}</p>
                            <p className="text-sm capitalize text-[#2F3A2D]">{obs.value}</p>
                          </div>
                          {obs.badge}
                        </div>
                        {explanation && (
                          <p className="text-[10px] text-[#8A9A82] mt-2 italic">
                            Por qué: {explanation}
                          </p>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-[#64705E]">No se detectaron observaciones adicionales.</p>
                )}
              </div>
              <p className="text-[10px] text-[#8A9A82] mt-3">Basado en observación visual de las fotografías.</p>
            </CardContent>
          </Card>

          {/* ─── 4. Factores Observados en la Imagen ─── */}
          {result.observations.length > 0 && (
            <Card className="p-6 border-t-4 border-t-[#C2E09D]">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-[#2F3A2D]">
                  <Leaf className="w-5 h-5 text-[#2F3A2D]" />
                  Factores Observados en la Imagen
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-2">
                  {result.observations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#64705E]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C2E09D] mt-1.5 shrink-0" />
                      {obs}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-[#8A9A82] mt-3">Basado únicamente en observaciones visuales de las fotografías proporcionadas.</p>
              </CardContent>
            </Card>
          )}

          {/* ─── 5. Recomendaciones Cosméticas ─── */}
          {result.recommendations.length > 0 && (
            <Card className="p-6 border-t-4 border-t-[#ECFFD3]">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-[#2F3A2D]">
                  <Sparkles className="w-5 h-5 text-[#2F3A2D]" />
                  Recomendaciones Cosméticas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#64705E]">
                      <CheckCircle2 className="w-4 h-4 text-[#C2E09D] mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* ─── 6. Rutina Sugerida ─── */}
          {(result.routine?.morning?.length > 0 || result.routine?.evening?.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {result.routine.morning.length > 0 && (
                <Card className="p-6 border-t-4 border-t-[#FFF6AD]">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-base text-[#2F3A2D]">
                      <Sun className="w-4 h-4 text-[#2F3A2D]" />
                      Rutina Mañana
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ol className="space-y-2">
                      {result.routine.morning.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#64705E]">
                          <span className="w-5 h-5 rounded-full bg-[#F0F5EC] text-[#2F3A2D] text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {result.routine.evening.length > 0 && (
                <Card className="p-6 border-t-4 border-t-[#C2E09D]">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-base text-[#2F3A2D]">
                      <Moon className="w-4 h-4 text-[#2F3A2D]" />
                      Rutina Noche
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ol className="space-y-2">
                      {result.routine.evening.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#64705E]">
                          <span className="w-5 h-5 rounded-full bg-[#F0F5EC] text-[#2F3A2D] text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ─── 7. Productos Compatibles ─── */}
          <Card className="p-6 border-t-4 border-t-[#ECFFD3]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-[#2F3A2D]">
                <ShoppingBag className="w-5 h-5 text-[#2F3A2D]" />
                Productos Compatibles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-[#64705E] mb-4">
                Explora nuestro catálogo de productos cosméticos para encontrar opciones adecuadas según
                las observaciones de tu análisis. Revisa los ingredientes y encuentra productos compatibles
                con tu tipo de piel.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/products">
                  <Button variant="secondary">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Ver catálogo de productos
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline">
                    <Scan className="w-4 h-4 mr-2" />
                    Escanear ingredientes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* ─── 8. Historial Relacionado ─── */}
          <Card className="p-6 border-t-4 border-t-[#FFF6AD]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-[#2F3A2D]">
                <History className="w-5 h-5 text-[#2F3A2D]" />
                Historial Relacionado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-[#64705E] mb-4">
                Te recomendamos realizar un nuevo análisis en 2-4 semanas para observar cambios en las
                características visuales de tu piel. Tu historial completo estará disponible para
                comparar la evolución.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/history">
                  <Button variant="secondary">
                    <History className="w-4 h-4 mr-2" />
                    Ver historial completo
                  </Button>
                </Link>
                <Link href="/analysis">
                  <Button variant="primary">
                    <Scan className="w-4 h-4 mr-2" />
                    Nueva observación
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* ─── Feedback ─── */}
          {session && (
          <Card className="p-6 border-t-4 border-t-[#C2E09D]">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="flex items-center gap-2 text-base text-[#2F3A2D]">
                <ThumbsUp className="w-4 h-4" />
                ¿Te fue útil este análisis?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {feedback ? (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#F0F5EC]">
                  {feedback === "yes" ? (
                    <ThumbsUp className="w-4 h-4 text-[#2F3A2D]" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 text-[#2F3A2D]" />
                  )}
                  <span className="text-sm text-[#2F3A2D]">
                    {feedback === "yes" ? "¡Nos alegra que te haya servido!" : "Gracias por tu honestidad. Seguiremos mejorando."}
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feedbackSubmitting}
                    onClick={() => submitFeedback("yes")}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1.5" />
                    Sí, útil
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={feedbackSubmitting}
                    onClick={() => submitFeedback("no")}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1.5" />
                    No tanto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* ─── Legal Disclaimer ─── */}
          <div className="p-4 rounded-2xl bg-[#F8FAF5] border border-[#DDE7D3]">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#2F3A2D] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#2F3A2D] mb-1">Información Importante</p>
                <p className="text-xs text-[#64705E] leading-relaxed">
                  Esta herramienta ofrece observaciones cosméticas orientativas basadas únicamente en
                  fotografías proporcionadas por el usuario. No constituye diagnóstico médico ni reemplaza
                  la evaluación de un dermatólogo. Los resultados pueden variar según la calidad de las
                  imágenes, condiciones de iluminación, y la información adicional proporcionada.
                </p>
              </div>
            </div>
          </div>

          {/* ─── Share ─── */}
          <Card className="p-6 border-t-4 border-t-[#ECFFD3]">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="flex items-center gap-2 text-base text-[#2F3A2D]">
                <Share2 className="w-4 h-4" />
                Compartir resultado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xs text-[#64705E] mb-3">Comparte tu experiencia con amigos o en redes sociales.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const text = `Descubrí que mi tipo de piel es ${result.skinType || "únic"}. Haz tu análisis gratis con IA en The Serene Lens.`
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://the-serene-lens-nuevo.onrender.com")}`
                    window.open(url, "_blank", "noopener,noreferrer")
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter
                </button>
                <button
                  onClick={() => {
                    const text = `Descubrí que mi tipo de piel es ${result.skinType || "únic"}. Haz tu análisis gratis con IA en The Serene Lens.`
                    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + "https://the-serene-lens-nuevo.onrender.com")}`
                    window.open(url, "_blank", "noopener,noreferrer")
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <button
                  onClick={() => {
                    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://the-serene-lens-nuevo.onrender.com")}`
                    window.open(url, "_blank", "noopener,noreferrer")
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </button>
              </div>
            </CardContent>
          </Card>

          {/* ─── Satisfaction Survey ─── */}
          {session && (
            <SatisfactionSurvey />
          )}

          {/* ─── Actions ─── */}
          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/history" className="flex-1">
              <Button variant="secondary" className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                Ver historial
              </Button>
            </Link>
            <Link href="/analysis" className="flex-1">
              <Button variant="primary" className="w-full">
                <Scan className="w-4 h-4 mr-2" />
                Nueva observación
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
