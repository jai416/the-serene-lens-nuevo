"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard, Users, CreditCard, MessageSquare, Newspaper, Package,
  DollarSign, Activity, Eye, TrendingUp, UserPlus, BarChart3, ArrowUpRight,
  Calendar, Sparkles, CheckCircle2, Clock, Bell, BookOpen, Trophy, Heart,
  ShoppingBag, MessageCircle, Settings, TrendingDown, Zap, Download, UsersRound,
  ShieldCheck, RefreshCw, Loader2, AlertCircle
} from "lucide-react"
import { NewUserToast } from "@/components/admin/new-user-toast"
import { getPlanLabel } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { CardSkeleton } from "@/components/ui/skeleton"

interface Stats {
  users: number
  analyses: number
  payments: number
  completedPayments: number
  pendingPayments: number
  messages: number
  unreadMessages: number
  posts: number
  products: number
  revenue: number
  revenueQvaPay: number
  revenueTransfer: number
  activeUsers: number
  newUsersThisMonth: number
  newUsersThisWeek: number
  newUsersToday: number
  analysesThisMonth: number
  analysesToday: number
  conversionRate: number
  paidUsers: number
  challenges: number
  diaryEntries: number
  subscriptions: number
  activeSubscriptions: number
  packs: number
  completedPacks: number
  comments: number
  featureFlags: number
  digitalProducts: number
  guideSales: number
  referralGroups: number
  completedGroups: number
  avgAnalysesPerUser: number
  churnRate: number
  usersYesterday: number
  analysesYesterday: number
  timestamp: string
}

interface RecentUser {
  id: string
  name: string | null
  email: string | null
  plan: string
  createdAt: string
}

interface RecentAnalysis {
  id: string
  skinType: string | null
  createdAt: string
  user: { name: string | null; email: string | null }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])
  const [planDistribution, setPlanDistribution] = useState<Record<string, number>>({})
  const [skinTypeDistribution, setSkinTypeDistribution] = useState<Record<string, number>>({})
  const [healthCheck, setHealthCheck] = useState<any>(null)
  const [queueStats, setQueueStats] = useState<{ pending: number; processing: number; completed: number; failed: number } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const fetchStats = useCallback(() => {
    setRefreshing(true)
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) {
          logger.error("Admin stats HTTP", { status: r.status, statusText: r.statusText })
          return null
        }
        return r.json()
      })
      .then((d) => {
        const body = d?.data || d
        if (body?.stats) {
          setStats(body.stats)
          setRecentUsers(body.recentUsers || [])
          setRecentAnalyses(body.recentAnalyses || [])
          setPlanDistribution(body.planDistribution || {})
          setSkinTypeDistribution(body.skinTypeDistribution || {})
        } else {
          logger.error("Admin stats empty response:", { response: d })
        }
        setRefreshing(false)
      })
      .catch((e) => { logger.error("Admin stats fetch error:", { error: e }); setRefreshing(false) })
  }, [])

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return

    fetchStats()
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealthCheck(d))
      .catch((e) => logger.error("Health check error:", { error: e }))
    fetch("/api/admin/queue-status")
      .then((r) => r.json())
      .then((d) => setQueueStats(d?.data?.stats || null))
      .catch((e) => logger.error("Queue stats error:", { error: e }))
    const interval = setInterval(fetchStats, 120000)
    return () => clearInterval(interval)
  }, [session])

  if (status === "loading") return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
  if (!session) redirect("/login?callbackUrl=/admin")
  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center p-8 bg-[#1E251C] rounded-2xl border border-[#222920] max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#FB7185]/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-[#FB7185] text-xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-[#FB7185] mb-2">Acceso denegado</h1>
          <p className="text-sm text-[#9BAA93] mb-1">No tienes permisos de administrador.</p>
          <p className="text-sm text-[#6B5C4F]">Tu rol: <code className="bg-[#222920] px-2 py-0.5 rounded text-[#88B078]">{session.user.role}</code></p>
          <p className="text-sm text-[#6B5C4F] mt-1">Email: {session.user.email}</p>
        </div>
      </div>
    )
  }

  const usersTrend = (stats?.newUsersToday ?? 0) - (stats?.usersYesterday ?? 0)
  const analysesTrend = (stats?.analysesToday ?? 0) - (stats?.analysesYesterday ?? 0)

  const mainCards = [
    { label: "Usuarios Totales", value: stats?.users ?? "—", icon: Users, href: "/admin/users", color: "bg-[#3D3228]", trend: `+${stats?.newUsersThisWeek ?? 0} esta semana` },
    { label: "Análisis Totales", value: stats?.analyses ?? "—", icon: Activity, href: "/admin", color: "bg-[#D4B896]", trend: `${stats?.analysesToday ?? 0} hoy · ${stats?.analysesThisMonth ?? 0} este mes` },
    { label: "Ingresos Totales", value: stats?.revenue ? `$${stats.revenue.toFixed(2)}` : "$0", icon: DollarSign, href: "/admin/payments", color: "bg-amber-700", trend: `QvaPay: $${stats?.revenueQvaPay?.toFixed(2) ?? "0.00"} | Transfer: $${stats?.revenueTransfer?.toFixed(2) ?? "0.00"}` },
    { label: "Mensajes", value: stats?.messages ?? "—", icon: MessageSquare, href: "/admin/messages", color: "bg-stone-600", trend: `${stats?.unreadMessages ?? 0} sin leer` },
  ]

  const metricCards = [
    { label: "Nuevos Hoy", value: stats?.newUsersToday ?? "—", icon: UserPlus, color: "text-[#3D3228] dark:text-[#D4B896]", sub: usersTrend !== 0 ? `${usersTrend > 0 ? "+" : ""}${usersTrend} vs ayer` : undefined },
    { label: "Análisis Hoy", value: stats?.analysesToday ?? "—", icon: BarChart3, color: "text-[#3D3228] dark:text-[#D4B896]", sub: analysesTrend !== 0 ? `${analysesTrend > 0 ? "+" : ""}${analysesTrend} vs ayer` : undefined },
    { label: "Tasa Conversión", value: stats?.conversionRate ? `${stats.conversionRate}%` : "0%", icon: TrendingUp, color: "text-[#3D3228] dark:text-[#D4B896]" },
    { label: "Usuarios Premium", value: stats?.paidUsers ?? "—", icon: Sparkles, color: "text-[#3D3228] dark:text-[#D4B896]", sub: `${stats?.activeSubscriptions ?? 0} suscripciones activas` },
    { label: "Blog Posts", value: stats?.posts ?? "—", icon: Newspaper, color: "text-[#3D3228] dark:text-[#D4B896]" },
    { label: "Productos", value: stats?.products ?? "—", icon: Package, color: "text-[#3D3228] dark:text-[#D4B896]" },
    { label: "Desafíos Activos", value: stats?.challenges ?? "—", icon: Trophy, color: "text-[#3D3228] dark:text-[#D4B896]" },
    { label: "Diario de Piel", value: stats?.diaryEntries ?? "—", icon: BookOpen, color: "text-[#3D3228] dark:text-[#D4B896]", sub: "entradas totales" },
    { label: "Packs Vendidos", value: stats?.completedPacks ?? "—", icon: ShoppingBag, color: "text-[#3D3228] dark:text-[#D4B896]", sub: `${stats?.packs ?? 0} total` },
    { label: "Comentarios", value: stats?.comments ?? "—", icon: MessageCircle, color: "text-[#3D3228] dark:text-[#D4B896]" },
    { label: "Guías Digitales", value: stats?.digitalProducts ?? "—", icon: Download, color: "text-[#3D3228] dark:text-[#D4B896]", sub: `${stats?.guideSales ?? 0} ventas` },
    { label: "Grupos de Referidos", value: stats?.referralGroups ?? "—", icon: UsersRound, color: "text-[#3D3228] dark:text-[#D4B896]", sub: `${stats?.completedGroups ?? 0} completados` },
    { label: "Prom. Análisis/Usuario", value: stats?.avgAnalysesPerUser ?? "—", icon: Zap, color: "text-[#3D3228] dark:text-[#D4B896]" },
    { label: "Pagos Pendientes", value: stats?.pendingPayments ?? "—", icon: Clock, color: "text-[#3D3228] dark:text-[#D4B896]" },
  ]

  const adminText = "text-[#E8DED5]"
  const adminSecondary = "text-[#9BAA93]"
  const adminMuted = "text-[#6B5C4F]"
  const adminCard = "bg-[#1A1F19] border-[#222920]"
  const adminAccent = "#88B078"

  return (
    <div className="overflow-x-hidden">
      <NewUserToast />
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-[#88B078]/20 text-[#88B078] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
            <LayoutDashboard className="w-3 h-3 mr-1.5" />
            Dashboard
          </Badge>
          {stats?.timestamp && (
            <span className="text-[10px] text-[#6B5C4F] flex items-center gap-2">
              {new Date(stats.timestamp).toLocaleTimeString("es")}
              <button onClick={fetchStats} className="hover:text-[#88B078] transition-colors" title="Refrescar ahora">
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#E8DED5]">
          Panel de <span style={{ color: adminAccent }}>Administración</span>
        </h1>
      </div>

      {/* Main Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="bg-[#1A1F19] border border-[#222920] rounded-xl p-5 transition-all duration-200 hover:border-[#88B078]/40 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#6B5C4F] group-hover:text-[#88B078] transition-colors" />
              </div>
              <p className="text-2xl font-bold text-[#E8DED5]">{card.value}</p>
              <p className="text-xs text-[#9BAA93]">{card.label}</p>
              {card.trend && <p className="text-[10px] text-[#6B5C4F] mt-1">{card.trend}</p>}
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {metricCards.map((card) => (
          <div key={card.label} className="bg-[#1E251C] border border-[#222920] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-[#9BAA93]">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-[#E8DED5]">{card.value}</p>
            {card.sub && <p className="text-[10px] text-[#6B5C4F] mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Health Check */}
      {healthCheck && (
        <div className="bg-[#1A1F19] border border-[#222920] rounded-xl p-5 mb-6">
          <h2 className="text-base font-semibold mb-4 text-[#E8DED5] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#88B078]" />
            Health Check
            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              healthCheck.status === "ok" ? "bg-[#4ADE80]/20 text-[#4ADE80]" : "bg-[#FB7185]/20 text-[#FB7185]"
            }`}>
              {healthCheck.status === "ok" ? "OPERATIONAL" : "DEGRADED"}
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(healthCheck.checks || {}).map(([name, check]: [string, any]) => (
              <div key={name} className="p-3 rounded-lg bg-[#1E251C]">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${check.status === "ok" ? "bg-[#4ADE80]" : "bg-[#FB7185]"}`} />
                  <span className="text-xs font-medium text-[#9BAA93] capitalize">{name}</span>
                </div>
                <p className="text-sm font-bold text-[#E8DED5]">
                  {check.latencyMs !== undefined ? `${check.latencyMs}ms` : check.status}
                </p>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-[#1E251C]">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-[#9BAA93]" />
                <span className="text-xs font-medium text-[#9BAA93]">Uptime</span>
              </div>
              <p className="text-sm font-bold text-[#E8DED5]">
                {Math.floor((healthCheck.uptime || 0) / 3600)}h {Math.floor(((healthCheck.uptime || 0) % 3600) / 60)}m
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#1E251C]">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-[#9BAA93]" />
                <span className="text-xs font-medium text-[#9BAA93]">Memoria</span>
              </div>
              <p className="text-sm font-bold text-[#E8DED5]">{healthCheck.memory?.heapUsedMB || 0}MB</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1A1F19] border border-[#222920] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E8DED5] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#88B078]" />
            Ingresos por Proveedor
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#9BAA93]">QvaPay</span>
              <span className="font-medium text-[#E8DED5]">${stats?.revenueQvaPay?.toFixed(2) ?? "0.00"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#9BAA93]">Transfermóvil</span>
              <span className="font-medium text-[#E8DED5]">${stats?.revenueTransfer?.toFixed(2) ?? "0.00"}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#1E251C] flex overflow-hidden ring-1 ring-inset ring-[#222920]">
              {(() => {
                const q = stats?.revenueQvaPay || 0
                const t = stats?.revenueTransfer || 0
                const total = q + t || 1
                const qp = ((q/total)*100).toFixed(1)
                const tp = ((t/total)*100).toFixed(1)
                return <>
                  {q > 0 && <div className="h-full bg-[#88B078] relative group cursor-pointer transition-all hover:brightness-110" style={{ width: `${qp}%` }} title={`QvaPay: $${q.toFixed(2)} (${qp}%)`} />}
                  {t > 0 && <div className="h-full bg-[#D4A574] relative group cursor-pointer transition-all hover:brightness-110" style={{ width: `${tp}%` }} title={`Transfermóvil: $${t.toFixed(2)} (${tp}%)`} />}
                </>
              })()}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(() => {
                const q = stats?.revenueQvaPay || 0
                const t = stats?.revenueTransfer || 0
                const total = q + t || 1
                const qp = ((q/total)*100).toFixed(1)
                const tp = ((t/total)*100).toFixed(1)
                return <>
                  <div className="p-2 rounded-lg bg-[#1E251C] border border-[#222920]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#88B078]" />
                      <span className="text-[10px] text-[#9BAA93]">QvaPay</span>
                    </div>
                    <p className="text-xs font-semibold text-[#E8DED5]">${q.toFixed(2)}</p>
                    <p className="text-[9px] text-[#6B5C4F]">{qp}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1E251C] border border-[#222920]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#D4A574]" />
                      <span className="text-[10px] text-[#9BAA93]">Transf.</span>
                    </div>
                    <p className="text-xs font-semibold text-[#E8DED5]">${t.toFixed(2)}</p>
                    <p className="text-[9px] text-[#6B5C4F]">{tp}%</p>
                  </div>
                </>
              })()}
            </div>
            <div className="pt-2 border-t border-[#222920]">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#E8DED5]">Total</span>
                <span className="font-bold text-[#88B078]">${stats?.revenue?.toFixed(2) ?? "0.00"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1F19] border border-[#222920] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E8DED5] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#88B078]" />
            Distribución de Planes
          </h2>
          <div className="space-y-3">
            {Object.entries(planDistribution).map(([plan, count]) => {
              const total = Object.values(planDistribution).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={plan}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[#9BAA93]">{getPlanLabel(plan)}</span>
                    <span className="text-sm font-medium text-[#E8DED5]">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1E251C]">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: adminAccent }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[#1A1F19] border border-[#222920] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E8DED5] flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#88B078]" />
            Tipos de Piel Detectados
          </h2>
          <div className="space-y-3">
            {Object.entries(skinTypeDistribution).sort(([, a], [, b]) => b - a).slice(0, 6).map(([type, count]) => {
              const total = Object.values(skinTypeDistribution).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={type}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[#9BAA93] capitalize">{type}</span>
                    <span className="text-sm font-medium text-[#E8DED5]">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1E251C]">
                    <div className="h-full rounded-full bg-[#4ADE80]" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Métricas de Crecimiento */}
      <div className="border border-[#222920] rounded-xl p-5 mb-6" style={{ backgroundColor: "#1A1F19" }}>
        <h2 className="text-base font-semibold mb-4 text-[#E8DED5] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#88B078]" />
          Métricas de Crecimiento
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(() => {
            const paid = stats?.paidUsers ?? 0
            const avgPlanPrice = 9.99
            const mrr = paid * avgPlanPrice
            const totalPlans = Object.values(planDistribution).reduce((a, b) => a + b, 0)
            const premiumCount = planDistribution["PREMIUM"] ?? 0
            const proCount = planDistribution["PRO"] ?? 0
            const proPlusCount = planDistribution["PRO_PLUS"] ?? 0
            const weightedAvg = totalPlans > 0
              ? ((premiumCount * 4.99 + proCount * 9.99 + proPlusCount * 14.99) / totalPlans)
              : avgPlanPrice
            const weightedMrr = paid * weightedAvg
            return [
              {
                label: "MRR",
                value: `$${weightedMrr.toFixed(2)}`,
                icon: DollarSign,
                sub: `${paid} usuarios de pago · $${weightedAvg.toFixed(2)} promedio`,
                color: "text-[#88B078]",
              },
              {
                label: "Ingresos último mes",
                value: stats?.revenue ? `$${(stats.revenue / 6).toFixed(2)}` : "$0.00",
                icon: Calendar,
                sub: "estimado del total anual",
                color: "text-[#D4A574]",
              },
              {
                label: "Churn Rate",
                value: stats?.churnRate ? `${(stats.churnRate * 100).toFixed(1)}%` : "0%",
                icon: TrendingDown,
                sub: "tasa de cancelación",
                color: "text-[#FB7185]",
              },
              {
                label: "Análisis/día",
                value: stats?.analysesToday ?? "—",
                icon: Activity,
                sub: (() => {
                  if (stats == null) return undefined
                  const diff = (stats.analysesToday ?? 0) - (stats.analysesYesterday ?? 0)
                  return (
                    <span className="flex items-center gap-0.5">
                      Ayer: {stats.analysesYesterday ?? 0}
                      <span className={diff >= 0 ? "text-[#4ADE80]" : "text-[#FB7185]"}>
                        {diff >= 0 ? "↑" : "↓"} {Math.abs(diff)}
                      </span>
                    </span>
                  )
                })(),
                color: "text-[#88B078]",
              },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-lg border border-[#222920]" style={{ backgroundColor: "#1E251C" }}>
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-xs text-[#9BAA93]">{m.label}</span>
                </div>
                <p className="text-xl font-bold text-[#E8DED5]">{m.value}</p>
                {typeof m.sub === "string" && <p className="text-[10px] text-[#6B5C4F] mt-0.5">{m.sub}</p>}
                {typeof m.sub !== "string" && m.sub}
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Queue Status */}
      {queueStats && (
        <div className="bg-[#1A1F19] border border-[#222920] rounded-xl p-5 mb-6">
          <h2 className="text-base font-semibold mb-4 text-[#E8DED5] flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#88B078]" />
            Cola de Análisis
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Pendientes", value: queueStats.pending, color: "text-[#FCD34D]", bg: "bg-[#FCD34D]/10" },
              { label: "Procesando", value: queueStats.processing, color: "text-[#60A5FA]", bg: "bg-[#60A5FA]/10" },
              { label: "Completados", value: queueStats.completed, color: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10" },
              { label: "Fallidos", value: queueStats.failed, color: "text-[#FB7185]", bg: "bg-[#FB7185]/10" },
            ].map((item) => (
              <div key={item.label} className={`p-3 rounded-lg border border-[#222920] ${item.bg}`}>
                <p className="text-xs text-[#9BAA93] mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-[#1A1F19] border border-[#222920] rounded-xl p-5 mb-6">
        <h2 className="text-base font-semibold mb-4 text-[#E8DED5] flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#88B078]" />
          Acceso Rápido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {[
            { href: "/admin/users", label: "Usuarios", icon: Users },
            { href: "/admin/payments", label: "Pagos", icon: CreditCard },
            { href: "/admin/messages", label: "Mensajes", icon: MessageSquare },
            { href: "/admin/emails", label: "Correos", icon: Bell },
            { href: "/admin/blog", label: "Blog", icon: Newspaper },
            { href: "/admin/products", label: "Productos", icon: Package },
            { href: "/admin/guides", label: "Guías", icon: Download },
            { href: "/admin/transfers", label: "Transferencias", icon: ShieldCheck },
            { href: "/admin/feature-flags", label: "Features", icon: Settings },
            { href: "/admin/knowledge", label: "Conocimiento", icon: BookOpen },
            { href: "/admin/telegram", label: "Telegram", icon: MessageCircle },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-[#222920] transition-colors group">
                <item.icon className="w-4 h-4 text-[#88B078]" />
                <span className="text-sm font-medium text-[#E8DED5] group-hover:text-white transition-colors">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[#1A1F19] border border-[#222920] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E8DED5] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#88B078]" />
            Usuarios Recientes
          </h2>
          <div className="space-y-2">
            {recentUsers.length > 0 ? recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1E251C]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#E8DED5] truncate">{user.name || user.email}</p>
                  <p className="text-xs text-[#9BAA93]">{user.email}</p>
                </div>
                <Badge variant={user.plan === "FREE" ? "secondary" : "primary"} className="text-[10px] bg-[#88B078]/20 text-[#88B078] border-0">
                  {getPlanLabel(user.plan)}
                </Badge>
              </div>
            )) : (
              <p className="text-sm text-[#9BAA93] text-center py-4">Sin datos</p>
            )}
          </div>
        </div>

        <div className="bg-[#1A1F19] border border-[#222920] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E8DED5] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#88B078]" />
            Análisis Recientes
          </h2>
          <div className="space-y-2">
            {recentAnalyses.length > 0 ? recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1E251C]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#E8DED5] truncate">
                    {analysis.user.name || analysis.user.email}
                  </p>
                  <p className="text-xs text-[#9BAA93]">
                    {analysis.skinType ? `Piel ${analysis.skinType}` : "Sin tipo"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  <span className="text-xs text-[#6B5C4F]">
                    {new Date(analysis.createdAt).toLocaleDateString("es")}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[#9BAA93] text-center py-4">Sin datos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
