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
} from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { toast } from "sonner"

interface AIResult {
  skinType: string
  texture: string
  pores: string
  shine: string
  uniformity: string
  apparentSensitivity: string
  apparentOil: string
  observations: string[]
  recommendations: string[]
  confidence: string
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
  { value: "bajo", label: "Bajo", color: "bg-[#ECFFD3] text-[#2F3A2D]" },
  { value: "moderado", label: "Moderado", color: "bg-[#FFF6AD] text-[#2F3A2D]" },
  { value: "visible", label: "Visible", color: "bg-[#FFF6AD] text-[#2F3A2D]" },
  { value: "leve", label: "Leve", color: "bg-[#ECFFD3] text-[#2F3A2D]" },
  { value: "alto", label: "Alto", color: "bg-[#FEF2F2] text-[#E07070]" },
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
        setAnalysis(data.analysis)
        const obs = JSON.parse(data.analysis.observations || "{}")
        const parsed: AIResult = {
          skinType: obs.skinType || "",
          texture: obs.texture || "",
          pores: obs.pores || "",
          shine: obs.shine || "",
          uniformity: obs.uniformity || "",
          apparentSensitivity: obs.apparentSensitivity || "",
          apparentOil: obs.apparentOil || "",
          observations: obs.observations || JSON.parse(data.analysis.observations || "[]"),
          recommendations: JSON.parse(data.analysis.recommendations || "[]"),
          confidence: obs.confidence || "media",
          routine: JSON.parse(data.analysis.routine || '{"morning":[],"evening":[]}'),
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
          <Card className="p-6">
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
            <Card className="p-6">
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
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-[#2F3A2D]">
                <Eye className="w-5 h-5 text-[#2F3A2D]" />
                Observaciones Detectadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                {allObservations.length > 0 ? (
                  allObservations.map((obs, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAF5]">
                      <div>
                        <p className="text-xs text-[#64705E]">{obs.label}</p>
                        <p className="text-sm capitalize text-[#2F3A2D]">{obs.value}</p>
                      </div>
                      {obs.badge}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#64705E]">No se detectaron observaciones adicionales.</p>
                )}
              </div>
              <p className="text-[10px] text-[#8A9A82] mt-3">Basado en observación visual de las fotografías.</p>
            </CardContent>
          </Card>

          {/* ─── 4. Factores Observados en la Imagen ─── */}
          {result.observations.length > 0 && (
            <Card className="p-6">
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
            <Card className="p-6">
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
                <Card className="p-6">
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
                <Card className="p-6">
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
          <Card className="p-6">
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
          <Card className="p-6">
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
          <Card className="p-6">
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
