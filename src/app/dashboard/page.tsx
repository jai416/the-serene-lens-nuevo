"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Scan, History, Droplets, Beaker, ArrowRight, Sparkles, Sun, Clock, ChevronRight, TrendingUp, Shield, Bell } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { CardSkeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Analysis {
  id: string
  skinType: string | null
  createdAt: string
}

interface Usage {
  plan: string
  isUnlimited: boolean
  monthlyLimit: number
  monthlyUsed: number
  monthlyRemaining: number
  totalRemaining: number | null
}

export default function DashboardPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)

  useEffect(() => {
    if (session) {
      fetch("/api/analysis")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          const raw = data?.data?.analyses ?? data.analyses
          setAnalyses(Array.isArray(raw) ? raw : [])
        })
        .catch(() => toast.error("Error al cargar análisis"))

      fetch("/api/user/usage")
        .then((res) => (res.ok ? res.json() : { usage: null }))
        .then((data) => setUsage(data?.data?.usage || data.usage))
        .catch(() => {})
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <CardSkeleton />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (!session) {
    redirect("/login?callbackUrl=" + encodeURIComponent(pathname))
  }

  const latestAnalysis = analyses[0]
  const hasAnalyses = analyses.length > 0
  const progressScore = hasAnalyses ? Math.min(100, 70 + analyses.length * 2) : 0

  return (
    <div className="px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Hero Module */}
        <Card className="p-6 md:p-8 border-0 shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)] relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#E2ECE0]/40 dark:bg-[#2A3A2A]/40" />
          <div className="absolute -bottom-10 -right-8 w-32 h-32 rounded-full bg-[#E2ECE0]/30 dark:bg-[#2A3A2A]/30" />
          <div className="absolute top-20 right-24 w-20 h-20 rounded-full bg-[#E2ECE0]/20 dark:bg-[#2A3A2A]/20" />
          <CardContent className="p-0 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-sm font-medium text-[#666666] dark:text-[#999999] mb-2">
                  ¡Hola, {session.user.name || "Usuario"}! 👋
                </p>
                <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] dark:text-[#F0F0F0] mb-3 leading-tight">
                  Conoce mejor tu piel
                </h1>
                <p className="text-[#666666] dark:text-[#999999] text-sm leading-relaxed mb-6 max-w-lg">
                  Descubre las características visibles de tu piel con análisis cosmético por IA.
                  Observa, aprende y mejora tu rutina de cuidado personal.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/analysis">
                    <Button className="gap-2">
                      <Scan className="w-4 h-4" />
                      Comenzar análisis
                    </Button>
                  </Link>
                  <Link href="/dashboard/diary">
                    <Button variant="secondary" className="gap-2">
                      <Droplets className="w-4 h-4" />
                      Ver cómo funciona
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid Categories Block — ¿Qué quieres hacer hoy? */}
        <div>
          <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-[#F0F0F0] mb-4">
            ¿Qué quieres hacer hoy?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Análisis de piel", desc: "Escanea tu rostro con IA", icon: Scan, href: "/analysis" },
              { title: "Historial", desc: `${analyses.length} análisis guardados`, icon: History, href: "/dashboard/history" },
              { title: "Rutinas", desc: "Tu diario de cuidado diario", icon: Droplets, href: "/dashboard/diary" },
              { title: "Ingredientes", desc: "Analiza productos y componentes", icon: Beaker, href: "/ingredients-analyzer" },
            ].map((card) => (
              <Link key={card.href} href={card.href}>
                <Card className="p-5 hover:-translate-y-1 cursor-pointer border border-[#E8E8E8]/60 dark:border-[#333333]/60">
                  <CardContent className="p-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#E2ECE0] dark:bg-[#2A3A2A] flex items-center justify-center mb-4">
                      <card.icon className="w-5 h-5 text-[#88B078]" />
                    </div>
                    <h3 className="font-semibold text-sm text-[#1A1A1A] dark:text-[#F0F0F0] mb-1">{card.title}</h3>
                    <p className="text-xs text-[#666666] dark:text-[#999999]">{card.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Two-column layout: Progress + Right widgets */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Progress Module */}
          <Card className="lg:col-span-2 p-6 border border-[#E8E8E8]/60 dark:border-[#333333]/60">
            <CardContent className="p-0">
              <h3 className="font-semibold text-sm text-[#1A1A1A] dark:text-[#F0F0F0] mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#88B078]" />
                Tu progreso
              </h3>
              <p className="text-xs text-[#666666] dark:text-[#999999] mb-6">
                Evolución de tu cuidado facial
              </p>

              <div className="flex items-center gap-8">
                {/* Mini chart area */}
                <div className="flex-1 h-24 relative">
                  <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#88B078" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#88B078" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,60 C30,55 50,50 70,35 C90,20 110,30 130,25 C150,20 170,10 200,15"
                      fill="none"
                      stroke="#88B078"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0,60 C30,55 50,50 70,35 C90,20 110,30 130,25 C150,20 170,10 200,15 L200,80 L0,80 Z"
                      fill="url(#chartGrad)"
                    />
                    <circle cx="70" cy="35" r="4" fill="#88B078" stroke="white" strokeWidth="2" />
                    <circle cx="130" cy="25" r="4" fill="#88B078" stroke="white" strokeWidth="2" />
                    <circle cx="200" cy="15" r="4" fill="#88B078" stroke="white" strokeWidth="2" />
                  </svg>
                </div>

                {/* Circular gauge */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#E2ECE0" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke="#88B078"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressScore / 100)}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#1A1A1A] dark:text-[#F0F0F0]">
                        {hasAnalyses ? progressScore : "—"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#666666] dark:text-[#999999] mt-2 font-medium">Buen estado</p>
                </div>
              </div>

              {usage && (
                <div className="mt-6 pt-4 border-t border-[#E8E8E8] dark:border-[#333333] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#666666] dark:text-[#999999]">
                    <Shield className="w-3.5 h-3.5 text-[#88B078]" />
                    {usage.isUnlimited
                      ? "Análisis ilimitados"
                      : `${usage.monthlyRemaining} análisis restantes este mes`
                    }
                  </div>
                  <Link href="/dashboard/subscription">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                      Ver plan
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Widgets */}
          <div className="space-y-4">
            {/* Analysis Summary Widget */}
            <Card className="p-5 border border-[#E8E8E8]/60 dark:border-[#333333]/60">
              <CardContent className="p-0">
                <h3 className="font-semibold text-sm text-[#1A1A1A] dark:text-[#F0F0F0] mb-3 flex items-center gap-2">
                  <Scan className="w-4 h-4 text-[#88B078]" />
                  Último análisis
                </h3>
                {hasAnalyses && latestAnalysis ? (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#E2ECE0] dark:bg-[#2A3A2A] flex items-center justify-center text-sm font-semibold text-[#88B078] shrink-0">
                        {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-xs text-[#666666] dark:text-[#999999]">{formatDate(latestAnalysis.createdAt)}</p>
                        {latestAnalysis.skinType && (
                          <Badge variant="mint" className="text-[10px] mt-1">
                            Piel {latestAnalysis.skinType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Link href={`/analysis/results/${latestAnalysis.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs gap-1 w-full justify-between">
                        Ver resultados
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-[#666666] dark:text-[#999999] mb-3">Aún no has realizado ningún análisis.</p>
                    <Link href="/analysis">
                      <Button size="sm" className="text-xs gap-1 w-full">
                        <Scan className="w-3 h-3" />
                        Comenzar ahora
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reminders & Insights Widget */}
            <Card className="p-5 border border-[#E8E8E8]/60 dark:border-[#333333]/60">
              <CardContent className="p-0">
                <h3 className="font-semibold text-sm text-[#1A1A1A] dark:text-[#F0F0F0] mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#88B078]" />
                  Recordatorios
                </h3>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2 text-xs text-[#666666] dark:text-[#999999]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#88B078] mt-1.5 shrink-0" />
                    Aplica protector solar cada 2 horas
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#666666] dark:text-[#999999]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#88B078] mt-1.5 shrink-0" />
                    Limpieza facial mañana y noche
                  </li>
                  <li className="flex items-start gap-2 text-xs text-[#666666] dark:text-[#999999]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#88B078] mt-1.5 shrink-0" />
                    Hidrata tu piel después de cada limpieza
                  </li>
                </ul>
                <Link href="/dashboard/diary">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 w-full justify-between">
                    Ver rutina
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sunscreen Reminder */}
            <Card className="p-4 border-0 bg-[#FFF9E6] dark:bg-[#3A3A2A]">
              <CardContent className="p-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FCEAA6] dark:bg-[#4A4A2A] flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5 text-[#1A1A1A] dark:text-[#F0F0F0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0]">Protección solar</p>
                  <p className="text-xs text-[#666666] dark:text-[#999999]">Usa SPF 50+ todos los días</p>
                </div>
                <Link href="/products?category=proteccion-solar">
                  <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1">
                    Ver
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Analyses */}
        {hasAnalyses && analyses.length > 1 && (
          <div>
            <h2 className="font-semibold text-base text-[#1A1A1A] dark:text-[#F0F0F0] mb-4">
              Análisis recientes
            </h2>
            <div className="space-y-2">
              {analyses.slice(1, 4).map((a, i) => (
                <Link key={a.id} href={`/analysis/results/${a.id}`}>
                  <Card className="p-4 hover:-translate-y-0.5 transition-all duration-300 border border-[#E8E8E8]/60 dark:border-[#333333]/60">
                    <CardContent className="p-0 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#E2ECE0] dark:bg-[#2A3A2A] flex items-center justify-center shrink-0">
                          <Scan className="w-4 h-4 text-[#88B078]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#F0F0F0] truncate">
                            Análisis {a.skinType ? `- ${a.skinType}` : `#${i + 2}`}
                          </p>
                          <p className="text-xs text-[#666666] dark:text-[#999999]">
                            {formatDate(a.createdAt)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#999999] dark:text-[#777777] shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
