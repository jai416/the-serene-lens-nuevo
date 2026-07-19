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
  guidesSold: number
  referralRevenue: number
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
        <div className="text-center p-8 bg-white rounded-2xl border border-[#E8E8E8] max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#E07070] text-xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-[#E07070] mb-2">Acceso denegado</h1>
          <p className="text-sm text-[#666666] mb-1">No tienes permisos de administrador.</p>
          <p className="text-sm text-[#666666]">Tu rol: <code className="bg-[#E8E8E8] px-2 py-0.5 rounded text-[#88B078]">{session.user.role}</code></p>
          <p className="text-sm text-[#666666] mt-1">Email: {session.user.email}</p>
        </div>
      </div>
    )
  }

  const usersTrend = (stats?.newUsersToday ?? 0) - (stats?.usersYesterday ?? 0)
  const analysesTrend = (stats?.analysesToday ?? 0) - (stats?.analysesYesterday ?? 0)

  const mainCards = [
    { label: "Usuarios Totales", value: stats?.users ?? "—", icon: Users, href: "/admin/users", color: "bg-[#88B078]", trend: `+${stats?.newUsersThisWeek ?? 0} esta semana` },
    { label: "Análisis Totales", value: stats?.analyses ?? "—", icon: Activity, href: "/admin", color: "bg-[#E2ECE0]", trend: `${stats?.analysesToday ?? 0} hoy · ${stats?.analysesThisMonth ?? 0} este mes` },
    { label: "Ingresos Totales", value: stats?.revenue ? `$${stats.revenue.toFixed(2)}` : "$0", icon: DollarSign, href: "/admin/payments", color: "bg-[#88B078]", trend: `QvaPay: $${stats?.revenueQvaPay?.toFixed(2) ?? "0.00"} | Transfer: $${stats?.revenueTransfer?.toFixed(2) ?? "0.00"}` },
    { label: "Mensajes", value: stats?.messages ?? "—", icon: MessageSquare, href: "/admin/messages", color: "bg-[#88B078]", trend: `${stats?.unreadMessages ?? 0} sin leer` },
  ]

  const metricCards = [
    { label: "Nuevos Hoy", value: stats?.newUsersToday ?? "—", icon: UserPlus, color: "text-[#88B078]", sub: usersTrend !== 0 ? `${usersTrend > 0 ? "+" : ""}${usersTrend} vs ayer` : undefined },
    { label: "Análisis Hoy", value: stats?.analysesToday ?? "—", icon: BarChart3, color: "text-[#88B078]", sub: analysesTrend !== 0 ? `${analysesTrend > 0 ? "+" : ""}${analysesTrend} vs ayer` : undefined },
    { label: "Nuevos Semana", value: stats?.newUsersThisWeek ?? "—", icon: Calendar, color: "text-[#88B078]", sub: `${stats?.newUsersThisMonth ?? 0} este mes` },
    { label: "Análisis Mes", value: stats?.analysesThisMonth ?? "—", icon: Activity, color: "text-[#88B078]" },
    { label: "Tasa Conversión", value: stats?.conversionRate ? `${stats.conversionRate}%` : "0%", icon: TrendingUp, color: "text-[#88B078]" },
    { label: "Usuarios Premium", value: stats?.paidUsers ?? "—", icon: Sparkles, color: "text-[#88B078]", sub: `${stats?.activeSubscriptions ?? 0} suscripciones activas` },
    { label: "Pagos Completados", value: stats?.completedPayments ?? "—", icon: CheckCircle2, color: "text-[#88B078]", sub: `${stats?.pendingPayments ?? 0} pendientes` },
    { label: "Guías Vendidas", value: stats?.guidesSold ?? "—", icon: Download, color: "text-[#88B078]", sub: `${stats?.referralRevenue ? `$${stats.referralRevenue.toFixed(2)} ref.` : ""}` },
    { label: "Productos", value: stats?.products ?? "—", icon: Package, color: "text-[#88B078]" },
    { label: "Blog Posts", value: stats?.posts ?? "—", icon: Newspaper, color: "text-[#88B078]" },
    { label: "Suscripciones Activas", value: stats?.activeSubscriptions ?? "—", icon: ShieldCheck, color: "text-[#88B078]" },
    { label: "Diario Entradas", value: stats?.diaryEntries ?? "—", icon: BookOpen, color: "text-[#88B078]" },
    { label: "Comentarios", value: stats?.comments ?? "—", icon: MessageCircle, color: "text-[#88B078]" },
    { label: "Desafíos", value: stats?.challenges ?? "—", icon: Trophy, color: "text-[#88B078]" },
    { label: "Prom. Análisis/Usuario", value: stats?.avgAnalysesPerUser ?? "—", icon: Zap, color: "text-[#88B078]" },
    { label: "Grupos Referidos", value: stats?.referralGroups ?? "—", icon: UsersRound, color: "text-[#88B078]", sub: `${stats?.completedGroups ?? 0} completados` },
  ]

  const adminText = "text-[#1A1A1A]"
  const adminSecondary = "text-[#666666]"
  const adminMuted = "text-[#666666]"
  const adminCard = "bg-white border-[#E8E8E8]"
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
            <span className="text-[10px] text-[#666666] flex items-center gap-2">
              {new Date(stats.timestamp).toLocaleTimeString("es")}
              <button onClick={fetchStats} className="hover:text-[#88B078] transition-colors" title="Refrescar ahora">
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
          Panel de <span style={{ color: adminAccent }}>Administración</span>
        </h1>
      </div>

      {/* Main Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="bg-white border border-[#E8E8E8] rounded-xl p-5 transition-all duration-200 hover:border-[#88B078]/40 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#666666] group-hover:text-[#88B078] transition-colors" />
              </div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{card.value}</p>
              <p className="text-xs text-[#666666]">{card.label}</p>
              {card.trend && <p className="text-[10px] text-[#666666] mt-1">{card.trend}</p>}
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {metricCards.map((card) => (
          <div key={card.label} className="bg-white border border-[#E8E8E8] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-[#666666]">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-[#1A1A1A]">{card.value}</p>
            {card.sub && <p className="text-[10px] text-[#666666] mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Health Check */}
      {healthCheck && (
        <div className="bg-white border border-[#E8E8E8] rounded-xl p-5 mb-6">
          <h2 className="text-base font-semibold mb-4 text-[#1A1A1A] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#88B078]" />
            Health Check
            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              healthCheck.status === "ok" ? "bg-[#E2ECE0] text-[#88B078]" : "bg-[#FEF2F2] text-[#E07070]"
            }`}>
              {healthCheck.status === "ok" ? "OPERATIONAL" : "DEGRADED"}
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(healthCheck.checks || {}).map(([name, check]: [string, any]) => (
              <div key={name} className="p-3 rounded-lg bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${check.status === "ok" ? "bg-[#88B078]" : "bg-[#E07070]"}`} />
                  <span className="text-xs font-medium text-[#666666] capitalize">{name}</span>
                </div>
                <p className="text-sm font-bold text-[#1A1A1A]">
                  {check.latencyMs !== undefined ? `${check.latencyMs}ms` : check.status}
                </p>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-[#666666]" />
                <span className="text-xs font-medium text-[#666666]">Uptime</span>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]">
                {Math.floor((healthCheck.uptime || 0) / 3600)}h {Math.floor(((healthCheck.uptime || 0) % 3600) / 60)}m
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-[#666666]" />
                <span className="text-xs font-medium text-[#666666]">Memoria</span>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]">{healthCheck.memory?.heapUsedMB || 0}MB</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#E8E8E8] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#1A1A1A] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#88B078]" />
            Ingresos por Proveedor
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#666666]">QvaPay</span>
              <span className="font-medium text-[#1A1A1A]">${stats?.revenueQvaPay?.toFixed(2) ?? "0.00"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#666666]">Transfermóvil</span>
              <span className="font-medium text-[#1A1A1A]">${stats?.revenueTransfer?.toFixed(2) ?? "0.00"}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white flex overflow-hidden ring-1 ring-inset ring-[#E8E8E8]">
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
                  <div className="p-2 rounded-lg bg-white border border-[#E8E8E8]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#88B078]" />
                      <span className="text-[10px] text-[#666666]">QvaPay</span>
                    </div>
                    <p className="text-xs font-semibold text-[#1A1A1A]">${q.toFixed(2)}</p>
                    <p className="text-[9px] text-[#666666]">{qp}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#E8E8E8]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#D4A574]" />
                      <span className="text-[10px] text-[#666666]">Transf.</span>
                    </div>
                    <p className="text-xs font-semibold text-[#1A1A1A]">${t.toFixed(2)}</p>
                    <p className="text-[9px] text-[#666666]">{tp}%</p>
                  </div>
                </>
              })()}
            </div>
            <div className="pt-2 border-t border-[#E8E8E8]">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#1A1A1A]">Total</span>
                <span className="font-bold text-[#88B078]">${stats?.revenue?.toFixed(2) ?? "0.00"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E8] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#1A1A1A] flex items-center gap-2">
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
                    <span className="text-sm text-[#666666]">{getPlanLabel(plan)}</span>
                    <span className="text-sm font-medium text-[#1A1A1A]">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: adminAccent }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E8] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#1A1A1A] flex items-center gap-2">
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
                    <span className="text-sm text-[#666666] capitalize">{type}</span>
                    <span className="text-sm font-medium text-[#1A1A1A]">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white">
                    <div className="h-full rounded-full bg-[#88B078]" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Métricas de Crecimiento */}
      <div className="border border-[#E8E8E8] rounded-xl p-5 mb-6" style={{ backgroundColor: "#FFFFFF" }}>
        <h2 className="text-base font-semibold mb-4 text-[#1A1A1A] flex items-center gap-2">
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
                color: "text-[#E07070]",
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
                      <span className={diff >= 0 ? "text-[#88B078]" : "text-[#E07070]"}>
                        {diff >= 0 ? "↑" : "↓"} {Math.abs(diff)}
                      </span>
                    </span>
                  )
                })(),
                color: "text-[#88B078]",
              },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-lg border border-[#E8E8E8]" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-xs text-[#666666]">{m.label}</span>
                </div>
                <p className="text-xl font-bold text-[#1A1A1A]">{m.value}</p>
                {typeof m.sub === "string" && <p className="text-[10px] text-[#666666] mt-0.5">{m.sub}</p>}
                {typeof m.sub !== "string" && m.sub}
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Queue Status */}
      {queueStats && (
        <div className="bg-white border border-[#E8E8E8] rounded-xl p-5 mb-6">
          <h2 className="text-base font-semibold mb-4 text-[#1A1A1A] flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#88B078]" />
            Cola de Análisis
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Pendientes", value: queueStats.pending, color: "text-[#FCD34D]", bg: "bg-[#FCD34D]/10" },
              { label: "Procesando", value: queueStats.processing, color: "text-[#60A5FA]", bg: "bg-[#60A5FA]/10" },
              { label: "Completados", value: queueStats.completed, color: "text-[#88B078]", bg: "bg-[#E2ECE0]" },
              { label: "Fallidos", value: queueStats.failed, color: "text-[#E07070]", bg: "bg-[#FEF2F2]" },
            ].map((item) => (
              <div key={item.label} className={`p-3 rounded-lg border border-[#E8E8E8] ${item.bg}`}>
                <p className="text-xs text-[#666666] mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

        {/* Quick Links */}
      <div className="bg-white border border-[#E8E8E8] rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold mb-5 text-[#1A1A1A] flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#88B078]" />
          Acceso Rápido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
            { href: "/admin/logs", label: "Logs", icon: Activity },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E8E8E8] hover:border-[#88B078]/40 hover:bg-[#F0F0F0] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-[#E2ECE0] flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#88B078]" />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A] text-center leading-tight">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E8E8E8] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#1A1A1A] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#88B078]" />
            Usuarios Recientes
          </h2>
          <div className="space-y-2">
            {recentUsers.length > 0 ? recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-white">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{user.name || user.email}</p>
                  <p className="text-xs text-[#666666]">{user.email}</p>
                </div>
                <Badge variant={user.plan === "FREE" ? "secondary" : "primary"} className="text-[10px] bg-[#88B078]/20 text-[#88B078] border-0">
                  {getPlanLabel(user.plan)}
                </Badge>
              </div>
            )) : (
              <p className="text-sm text-[#666666] text-center py-4">Sin datos</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E8] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#1A1A1A] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#88B078]" />
            Análisis Recientes
          </h2>
          <div className="space-y-2">
            {recentAnalyses.length > 0 ? recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-3 rounded-lg bg-white">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {analysis.user.name || analysis.user.email}
                  </p>
                  <p className="text-xs text-[#666666]">
                    {analysis.skinType ? `Piel ${analysis.skinType}` : "Sin tipo"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#88B078]" />
                  <span className="text-xs text-[#666666]">
                    {new Date(analysis.createdAt).toLocaleDateString("es")}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[#666666] text-center py-4">Sin datos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
