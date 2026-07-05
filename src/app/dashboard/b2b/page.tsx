"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Download, Upload, Package, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { CardSkeleton } from "@/components/ui/skeleton"

interface ClinicData {
  id: string
  name: string
  logo: string | null
  address: string | null
}

interface ClientAnalysis {
  id: string
  skinType: string | null
  createdAt: string
}

export default function B2bDashboard() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [clinic, setClinic] = useState<ClinicData | null>(null)
  const [analyses, setAnalyses] = useState<ClientAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    if (session?.user) {
      fetch("/api/user/clinic", { signal: controller.signal })
        .then((res) => res.ok ? res.json() : { clinic: null, analyses: [] })
        .then((data) => {
          setClinic(data.clinic)
          setAnalyses(data.analyses || [])
        })
        .catch(() => toast.error("Error al cargar datos"))
        .finally(() => setLoading(false))
    }
    return () => controller.abort()
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CardSkeleton />
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const isB2b = (session.user as any).plan === "ESTHETICIAN"

  if (!isB2b) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F5EC] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-[#8A7A6A]" />
          </div>
          <h2 className="font-serif text-xl font-semibold mb-2 text-[#3D3229]">Plan no disponible</h2>
          <p className="text-sm text-[#8A7A6A] mb-6">Este panel es exclusivo para profesionales con plan Esteticista.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Building2 className="w-3.5 h-3.5 mr-2" />
            Panel B2B
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D3229]">
            {clinic?.name || "Mi Clínica"}
          </h1>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <CardContent className="p-0">
              <p className="text-xs text-[#8A7A6A] mb-1">Análisis realizados</p>
              <p className="text-2xl font-semibold text-[#3D3229]">{analyses.length}</p>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent className="p-0">
              <p className="text-xs text-[#8A7A6A] mb-1">Plan</p>
              <p className="text-2xl font-semibold text-[#3D3229]">Esteticista</p>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardContent className="p-0">
              <p className="text-xs text-[#8A7A6A] mb-1">Límite</p>
              <p className="text-2xl font-semibold text-[#3D3229]">Ilimitado</p>
            </CardContent>
          </Card>
        </div>

        {clinic && (
          <Card className="p-6 mb-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-[#3D3229]">
                <Building2 className="w-5 h-5" />
                Personalización
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-[#3D3229]">Nombre de la clínica</label>
                <input
                  type="text"
                  aria-label="Nombre de la clínica"
                  defaultValue={clinic.name}
                  className="w-full rounded-xl border border-[#E8DDD0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E8D5C4] text-[#3D3229]"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-[#3D3229]">Logo</label>
                <div className="flex items-center gap-3">
                  {clinic.logo && (
                    <div className="w-12 h-12 rounded-xl bg-[#F0F5EC] flex items-center justify-center overflow-hidden">
                      <img src={clinic.logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-1.5" />
                    {clinic.logo ? "Cambiar logo" : "Subir logo"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-[#3D3229]">
              <TrendingUp className="w-5 h-5" />
              Historial de análisis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {analyses.length === 0 ? (
              <p className="text-sm text-[#8A7A6A]">No hay análisis realizados aún.</p>
            ) : (
              <div className="space-y-3">
                {analyses.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF8F0]">
                    <div>
                      <p className="text-sm capitalize text-[#3D3229]">{a.skinType || "Sin clasificar"}</p>
                      <p className="text-xs text-[#8A7A6A]">{new Date(a.createdAt).toLocaleDateString("es-ES")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={async () => {
                        try {
                          const res = await fetch(`/api/reports/generate?analysisId=${a.id}`)
                          if (!res.ok) throw new Error()
                          const blob = await res.blob()
                          const url = URL.createObjectURL(blob)
                          const aEl = document.createElement("a")
                          aEl.href = url
                          aEl.download = `reporte-${a.id}.pdf`
                          aEl.click()
                          URL.revokeObjectURL(url)
                        } catch {
                          toast.error("Error al generar PDF")
                        }
                      }}>
                        <Download className="w-4 h-4 mr-1.5" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
