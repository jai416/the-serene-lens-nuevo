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

const faceZones = [
  { label: "Frente", x: 50, y: 18 },
  { label: "Nariz", x: 50, y: 42 },
  { label: "Mejillas", x: 25, y: 40 },
  { label: "Mejillas", x: 75, y: 40 },
  { label: "Mentón", x: 50, y: 65 },
]

function FaceMap() {
  const svgRef = useRef<SVGSVGElement>(null)

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={svgRef}
        viewBox="0 0 120 140"
        className="w-32 h-36 sm:w-40 sm:h-44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="60" cy="65" rx="45" ry="55" className="stroke-[rgba(255,255,255,0.2)]" strokeWidth="1.5" />
        <circle cx="60" cy="50" r="4" className="fill-[rgba(183,255,42,0.2)] stroke-primary" strokeWidth="0.5" />
        {faceZones.map((zone, i) => (
          <g key={i}>
            <circle cx={zone.x} cy={zone.y} r="8" className="fill-[rgba(183,255,42,0.08)] stroke-[rgba(183,255,42,0.3)]" strokeWidth="0.5" />
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {faceZones.map((zone, i) => (
          <span key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            {zone.label}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Áreas analizadas visualmente</p>
    </div>
  )
}

export default function AnalysisResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [result, setResult] = useState<AIResult | null>(null)
  const [loading, setLoading] = useState(true)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 animate-neon-pulse">
            <Scan className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-on-surface-variant">Cargando resultados...</p>
        </div>
      </div>
    )
  }

  if (!analysis || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-xl font-semibold mb-2">Análisis no encontrado</h2>
          <p className="text-on-surface-variant text-sm mb-6">Este análisis no existe o ha sido eliminado.</p>
          <Link href="/analysis">
            <Button variant="neon">
              <Scan className="w-4 h-4 mr-2" />
              Nuevo análisis
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/analysis")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Nuevo análisis
          </Button>
          <Badge variant="neon" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Eye className="w-3.5 h-3.5 mr-2" />
            Resultados
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
            Tu <span className="gradient-text">Análisis</span>
          </h1>
        </div>

        <div className="space-y-5">
          {/* ─── 1. Resumen General ─── */}
          <Card className="p-6 border-[rgba(255,255,255,0.25)]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" />
                Resumen General
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                  <p className="text-xs text-muted-foreground mb-1">Piel aparente</p>
                  <p className="text-sm font-medium capitalize">{result.skinType || "No determinado"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                  <p className="text-xs text-muted-foreground mb-1">Confianza</p>
                  <p className="text-sm font-medium capitalize">{result.confidence}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                  <p className="text-xs text-muted-foreground mb-1">Textura</p>
                  <p className="text-sm font-medium capitalize">{result.texture || "No determinada"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                  <p className="text-xs text-muted-foreground mb-1">Brillo</p>
                  <p className="text-sm font-medium capitalize">{result.shine || "No determinado"}</p>
                </div>
                {result.uniformity && (
                  <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                    <p className="text-xs text-muted-foreground mb-1">Uniformidad</p>
                    <p className="text-sm font-medium capitalize">{result.uniformity}</p>
                  </div>
                )}
                {result.apparentSensitivity && (
                  <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                    <p className="text-xs text-muted-foreground mb-1">Sensibilidad aparente</p>
                    <p className="text-sm font-medium capitalize">{result.apparentSensitivity}</p>
                  </div>
                )}
                {result.apparentOil && (
                  <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                    <p className="text-xs text-muted-foreground mb-1">Grasa aparente</p>
                    <p className="text-sm font-medium capitalize">{result.apparentOil}</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2">Basado únicamente en observaciones visuales.</p>
            </CardContent>
          </Card>

          {/* ─── 2. Observaciones Visuales + Mapa Facial ─── */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-6 border-[rgba(255,255,255,0.25)] sm:col-span-2">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5 text-primary" />
                  Observaciones Visuales
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                {result.texture && (
                  <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                    <p className="text-xs text-muted-foreground mb-0.5">Textura facial</p>
                    <p className="text-sm capitalize">{result.texture}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Basado en observación visual.</p>
                  </div>
                )}
                {result.pores && (
                  <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                    <p className="text-xs text-muted-foreground mb-0.5">Poros</p>
                    <p className="text-sm capitalize">{result.pores}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Basado en observación visual.</p>
                  </div>
                )}
                {result.shine && (
                  <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                    <p className="text-xs text-muted-foreground mb-0.5">Brillo facial</p>
                    <p className="text-sm capitalize">{result.shine}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Basado en observación visual.</p>
                  </div>
                )}
                {result.uniformity && (
                  <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                    <p className="text-xs text-muted-foreground mb-0.5">Uniformidad del tono</p>
                    <p className="text-sm capitalize">{result.uniformity}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Basado en observación visual.</p>
                  </div>
                )}
                {result.apparentSensitivity && (
                  <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                    <p className="text-xs text-muted-foreground mb-0.5">Sensibilidad aparente</p>
                    <p className="text-sm capitalize">{result.apparentSensitivity}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Basado en observación visual.</p>
                  </div>
                )}
                {result.apparentOil && (
                  <div className="p-3 rounded-2xl bg-[rgba(255,255,255,0.04)]">
                    <p className="text-xs text-muted-foreground mb-0.5">Grasa aparente</p>
                    <p className="text-sm capitalize">{result.apparentOil}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Basado en observación visual.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="p-6 border-[rgba(255,255,255,0.25)] flex items-center justify-center">
              <FaceMap />
            </Card>
          </div>

          {/* ─── 3. Aspectos Observados ─── */}
          {result.observations.length > 0 && (
            <Card className="p-6 border-[rgba(255,255,255,0.25)]">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Droplets className="w-5 h-5 text-primary" />
                  Aspectos Observados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-2">
                  {result.observations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {obs}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-muted-foreground/60 mt-3">Basado únicamente en observaciones visuales de las fotografías proporcionadas.</p>
              </CardContent>
            </Card>
          )}

          {/* ─── 4. Recomendaciones Cosméticas ─── */}
          {result.recommendations.length > 0 && (
            <Card className="p-6 border-[rgba(255,255,255,0.25)]">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Recomendaciones Cosméticas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* ─── 5. Rutina Sugerida ─── */}
          {(result.routine?.morning?.length > 0 || result.routine?.evening?.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {result.routine.morning.length > 0 && (
                <Card className="p-6 border-[rgba(255,255,255,0.25)]">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sun className="w-4 h-4 text-primary" />
                      Rutina Mañana
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ol className="space-y-2">
                      {result.routine.morning.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
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
                <Card className="p-6 border-[rgba(255,255,255,0.25)]">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Moon className="w-4 h-4 text-primary" />
                      Rutina Noche
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ol className="space-y-2">
                      {result.routine.evening.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
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

          {/* ─── 6. Productos Recomendados ─── */}
          <Card className="p-6 border-[rgba(255,255,255,0.25)]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Productos Recomendados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-on-surface-variant mb-4">
                Explora nuestro catálogo de productos cosméticos para encontrar opciones adecuadas según
                las observaciones de tu análisis.
              </p>
              <Link href="/products">
                <Button variant="glass">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Ver catálogo de productos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* ─── 7. Seguimiento ─── */}
          <Card className="p-6 border-[rgba(255,255,255,0.25)]">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary" />
                Seguimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-on-surface-variant mb-4">
                Te recomendamos realizar un nuevo análisis en 2-4 semanas para observar cambios en las
                características visuales de tu piel.
              </p>
              <Link href="/analysis">
                <Button variant="glass">
                  <Scan className="w-4 h-4 mr-2" />
                  Nueva observación
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* ─── 8. Limitaciones del Análisis ─── */}
          <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)]">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-on-surface mb-1">Limitaciones del Análisis</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Esta herramienta realiza observaciones cosméticas y educativas basadas únicamente en fotografías
                  y la información proporcionada por el usuario. No diagnostica enfermedades, no sustituye a
                  dermatólogos ni profesionales de la salud y no debe utilizarse como herramienta médica.
                  Los resultados pueden variar según la calidad de las imágenes y las condiciones de iluminación.
                </p>
              </div>
            </div>
          </div>

          {/* ─── Actions ─── */}
          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/history" className="flex-1">
              <Button variant="glass" className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                Ver historial
              </Button>
            </Link>
            <Link href="/analysis" className="flex-1">
              <Button variant="neon" className="w-full">
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
