"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Scan, History, CreditCard, User, ArrowRight, Sparkles, Clock, BarChart3 } from "lucide-react"
import { getPlanLabel, formatDate } from "@/lib/utils"
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
  const { data: session, status } = useSession()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)

  useEffect(() => {
    if (session) {
      fetch("/api/analysis")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setAnalyses(data.analyses || []))
        .catch(() => toast.error("Error al cargar análisis"))

      fetch("/api/user/usage")
        .then((res) => (res.ok ? res.json() : { usage: null }))
        .then((data) => setUsage(data.usage))
        .catch(() => {})
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-on-surface-variant">Cargando...</p>
      </div>
    )
  }

  if (!session) {
    redirect("/api/auth/signin")
  }

  const plan = session.user.plan || "FREE"
  const isPaid = plan !== "FREE"
  const latestAnalysis = analyses[0]

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Badge variant="neon" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
            Dashboard
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
            Bienvenido, {session.user.name || "Usuario"}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Gestiona tus análisis, suscripción y perfil.
          </p>
        </div>

        {/* Plan + Usage Summary */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Card className="p-5 border-[rgba(255,255,255,0.25)]">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Plan {getPlanLabel(plan)}</span>
                </div>
                <Badge className={isPaid ? "bg-primary text-primary-foreground" : "bg-[rgba(255,255,255,0.06)] text-muted-foreground"}>
                  {isPaid ? "Activo" : "Gratuito"}
                </Badge>
              </div>
              {usage && (
                <div className="space-y-2">
                  {!usage.isUnlimited && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Análisis este mes</span>
                        <span>{usage.monthlyUsed} / {usage.monthlyLimit}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-primary transition-all"
                          style={{ width: `${Math.min(100, (usage.monthlyUsed / usage.monthlyLimit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {usage.isUnlimited ? (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> Análisis ilimitados
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {usage.totalRemaining != null && usage.totalRemaining !== Infinity
                        ? `${usage.totalRemaining} análisis restantes`
                        : "Análisis ilimitados"}
                    </p>
                  )}
                </div>
              )}
              {!isPaid && (
                <Link href="/pricing" className="mt-3 block">
                  <span className="text-xs text-primary hover:underline">Actualizar plan →</span>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="p-5 border-[rgba(255,255,255,0.25)]">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Último Análisis</span>
              </div>
              {latestAnalysis ? (
                <div>
                  <p className="text-xs text-muted-foreground">{formatDate(latestAnalysis.createdAt)}</p>
                  <p className="text-sm mt-1">
                    {latestAnalysis.skinType ? `Piel ${latestAnalysis.skinType}` : "Análisis completado"}
                  </p>
                  <Link href={`/analysis/results/${latestAnalysis.id}`} className="mt-2 block">
                    <span className="text-xs text-primary hover:underline">Ver resultados →</span>
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground">Aún no has realizado ningún análisis.</p>
                  <Link href="/analysis" className="mt-2 block">
                    <span className="text-xs text-primary hover:underline">Comenzar ahora →</span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            { title: "Nuevo Análisis", desc: "Observa tu piel ahora", icon: Scan, href: "/analysis" },
            { title: "Mi Historial", desc: `${analyses.length} análisis guardados`, icon: History, href: "/dashboard/history" },
            { title: "Mi Suscripción", desc: `Plan ${getPlanLabel(plan)}`, icon: CreditCard, href: "/dashboard/subscription" },
            { title: "Mi Perfil", desc: session.user.email || "", icon: User, href: "/dashboard/profile" },
          ].map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="p-5 border-[rgba(255,255,255,0.25)] hover:border-primary/30 transition-all duration-200 group">
                <CardContent className="p-0 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0 neon-glow">
                    <card.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{card.title}</h3>
                    <p className="text-xs text-on-surface-variant truncate">{card.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Analyses */}
        {analyses.length > 0 && (
          <div>
            <h2 className="font-serif text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Últimos Análisis
            </h2>
            <div className="space-y-2">
              {analyses.slice(0, 5).map((a) => (
                <Link key={a.id} href={`/analysis/results/${a.id}`}>
                  <Card className="p-4 border-[rgba(255,255,255,0.25)] hover:border-primary/30 transition-all duration-200">
                    <CardContent className="p-0 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Scan className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            Análisis {a.skinType ? `- ${a.skinType}` : ""}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {formatDate(a.createdAt)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {analyses.length === 0 && (
          <Card className="p-8 text-center border-[rgba(255,255,255,0.25)]">
            <CardContent className="p-0">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 neon-glow">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Comienza tu primer análisis</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Aún no tienes análisis guardados. Descubre las características visibles de tu piel.
              </p>
              <Link href="/analysis">
                <button className="inline-flex items-center justify-center text-sm font-medium transition-all bg-primary text-primary-foreground shadow-[0_0_20px_rgba(183,255,42,0.3)] hover:shadow-[0_0_30px_rgba(183,255,42,0.5)] hover:scale-[1.02] rounded-xl h-12 px-8">
                  <Scan className="w-4 h-4 mr-2" />
                  Observar mi piel
                </button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
