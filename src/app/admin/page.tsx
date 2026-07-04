"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard, Users, CreditCard, MessageSquare, Newspaper, Package,
  DollarSign, Activity, Eye, TrendingUp, UserPlus, BarChart3, ArrowUpRight,
  Calendar, Sparkles, CheckCircle2, Clock, Bell, BookOpen, Trophy, Heart,
  ShoppingBag, MessageCircle, Settings, TrendingDown, Zap, Download, UsersRound,
  ShieldCheck
} from "lucide-react"
import { NewUserToast } from "@/components/admin/new-user-toast"
import { getPlanLabel } from "@/lib/utils"

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
  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return

    const fetchStats = () => {
      fetch("/api/admin/stats")
        .then((r) => {
          if (!r.ok) {
            console.error("Admin stats HTTP", r.status, r.statusText)
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
            console.error("Admin stats empty response:", d)
          }
        })
        .catch((e) => console.error("Admin stats fetch error:", e))
    }

    fetchStats()
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealthCheck(d))
      .catch((e) => console.error("Health check error:", e))
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [session])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-[#8892B0]">Cargando...</p></div>
  if (!session) redirect("/login?callbackUrl=/admin")
  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center p-8 bg-[#1A1D27] rounded-2xl border border-[#2D3350] max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#FB7185]/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-[#FB7185] text-xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-[#FB7185] mb-2">Acceso denegado</h1>
          <p className="text-sm text-[#8892B0] mb-1">No tienes permisos de administrador.</p>
          <p className="text-sm text-[#5A6485]">Tu rol: <code className="bg-[#2D3350] px-2 py-0.5 rounded text-[#7C8CFF]">{session.user.role}</code></p>
          <p className="text-sm text-[#5A6485] mt-1">Email: {session.user.email}</p>
        </div>
      </div>
    )
  }

  const usersTrend = (stats?.newUsersToday ?? 0) - (stats?.usersYesterday ?? 0)
  const analysesTrend = (stats?.analysesToday ?? 0) - (stats?.analysesYesterday ?? 0)

  const mainCards = [
    { label: "Usuarios Totales", value: stats?.users ?? "—", icon: Users, href: "/admin/users", color: "bg-[#2F3A2D]", trend: `+${stats?.newUsersThisWeek ?? 0} esta semana` },
    { label: "Análisis Totales", value: stats?.analyses ?? "—", icon: Activity, href: "/admin", color: "bg-[#C2E09D]", trend: `${stats?.analysesToday ?? 0} hoy · ${stats?.analysesThisMonth ?? 0} este mes` },
    { label: "Ingresos Totales", value: stats?.revenue ? `$${stats.revenue.toFixed(2)}` : "$0", icon: DollarSign, href: "/admin/payments", color: "bg-emerald-600", trend: `QvaPay: $${stats?.revenueQvaPay?.toFixed(2) ?? "0.00"}` },
    { label: "Mensajes", value: stats?.messages ?? "—", icon: MessageSquare, href: "/admin/messages", color: "bg-purple-600", trend: `${stats?.unreadMessages ?? 0} sin leer` },
  ]

  const metricCards = [
    { label: "Nuevos Hoy", value: stats?.newUsersToday ?? "—", icon: UserPlus, color: "text-[#2F3A2D] dark:text-[#C2E09D]", sub: usersTrend !== 0 ? `${usersTrend > 0 ? "+" : ""}${usersTrend} vs ayer` : undefined },
    { label: "Análisis Hoy", value: stats?.analysesToday ?? "—", icon: BarChart3, color: "text-[#2F3A2D] dark:text-[#C2E09D]", sub: analysesTrend !== 0 ? `${analysesTrend > 0 ? "+" : ""}${analysesTrend} vs ayer` : undefined },
    { label: "Tasa Conversión", value: stats?.conversionRate ? `${stats.conversionRate}%` : "0%", icon: TrendingUp, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Usuarios Premium", value: stats?.paidUsers ?? "—", icon: Sparkles, color: "text-[#2F3A2D] dark:text-[#C2E09D]", sub: `${stats?.activeSubscriptions ?? 0} suscripciones activas` },
    { label: "Blog Posts", value: stats?.posts ?? "—", icon: Newspaper, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Productos", value: stats?.products ?? "—", icon: Package, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Desafíos Activos", value: stats?.challenges ?? "—", icon: Trophy, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Diario de Piel", value: stats?.diaryEntries ?? "—", icon: BookOpen, color: "text-[#2F3A2D] dark:text-[#C2E09D]", sub: "entradas totales" },
    { label: "Packs Vendidos", value: stats?.completedPacks ?? "—", icon: ShoppingBag, color: "text-[#2F3A2D] dark:text-[#C2E09D]", sub: `${stats?.packs ?? 0} total` },
    { label: "Comentarios", value: stats?.comments ?? "—", icon: MessageCircle, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Guías Digitales", value: stats?.digitalProducts ?? "—", icon: Download, color: "text-[#2F3A2D] dark:text-[#C2E09D]", sub: `${stats?.guideSales ?? 0} ventas` },
    { label: "Grupos de Referidos", value: stats?.referralGroups ?? "—", icon: UsersRound, color: "text-[#2F3A2D] dark:text-[#C2E09D]", sub: `${stats?.completedGroups ?? 0} completados` },
    { label: "Prom. Análisis/Usuario", value: stats?.avgAnalysesPerUser ?? "—", icon: Zap, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Pagos Pendientes", value: stats?.pendingPayments ?? "—", icon: Clock, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
  ]

  const adminText = "text-[#E2E8F0]"
  const adminSecondary = "text-[#8892B0]"
  const adminMuted = "text-[#5A6485]"
  const adminCard = "bg-[#22263A] border-[#2D3350]"
  const adminAccent = "#7C8CFF"

  return (
    <div className="overflow-x-hidden">
      <NewUserToast />
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-[#7C8CFF]/20 text-[#7C8CFF] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
            <LayoutDashboard className="w-3 h-3 mr-1.5" />
            Dashboard
          </Badge>
          {stats?.timestamp && (
            <span className="text-[10px] text-[#5A6485]">
              {new Date(stats.timestamp).toLocaleTimeString("es")}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#E2E8F0]">
          Panel de <span style={{ color: adminAccent }}>Administración</span>
        </h1>
      </div>

      {/* Main Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="bg-[#22263A] border border-[#2D3350] rounded-xl p-5 transition-all duration-200 hover:border-[#7C8CFF]/40 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#5A6485] group-hover:text-[#7C8CFF] transition-colors" />
              </div>
              <p className="text-2xl font-bold text-[#E2E8F0]">{card.value}</p>
              <p className="text-xs text-[#8892B0]">{card.label}</p>
              {card.trend && <p className="text-[10px] text-[#5A6485] mt-1">{card.trend}</p>}
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {metricCards.map((card) => (
          <div key={card.label} className="bg-[#1A1D27] border border-[#2D3350] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-[#8892B0]">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-[#E2E8F0]">{card.value}</p>
            {card.sub && <p className="text-[10px] text-[#5A6485] mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Health Check */}
      {healthCheck && (
        <div className="bg-[#22263A] border border-[#2D3350] rounded-xl p-5 mb-6">
          <h2 className="text-base font-semibold mb-4 text-[#E2E8F0] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#7C8CFF]" />
            Health Check
            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              healthCheck.status === "ok" ? "bg-[#4ADE80]/20 text-[#4ADE80]" : "bg-[#FB7185]/20 text-[#FB7185]"
            }`}>
              {healthCheck.status === "ok" ? "OPERATIONAL" : "DEGRADED"}
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(healthCheck.checks || {}).map(([name, check]: [string, any]) => (
              <div key={name} className="p-3 rounded-lg bg-[#1A1D27]">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${check.status === "ok" ? "bg-[#4ADE80]" : "bg-[#FB7185]"}`} />
                  <span className="text-xs font-medium text-[#8892B0] capitalize">{name}</span>
                </div>
                <p className="text-sm font-bold text-[#E2E8F0]">
                  {check.latencyMs !== undefined ? `${check.latencyMs}ms` : check.status}
                </p>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-[#1A1D27]">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-[#8892B0]" />
                <span className="text-xs font-medium text-[#8892B0]">Uptime</span>
              </div>
              <p className="text-sm font-bold text-[#E2E8F0]">
                {Math.floor((healthCheck.uptime || 0) / 3600)}h {Math.floor(((healthCheck.uptime || 0) % 3600) / 60)}m
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#1A1D27]">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-[#8892B0]" />
                <span className="text-xs font-medium text-[#8892B0]">Memoria</span>
              </div>
              <p className="text-sm font-bold text-[#E2E8F0]">{healthCheck.memory?.heapUsedMB || 0}MB</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#22263A] border border-[#2D3350] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E2E8F0] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#7C8CFF]" />
            Ingresos por Proveedor
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8892B0]">QvaPay</span>
              <span className="font-medium text-[#E2E8F0]">${stats?.revenueQvaPay?.toFixed(2) ?? "0.00"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8892B0]">Transfermóvil</span>
              <span className="font-medium text-[#E2E8F0]">${stats?.revenueTransfer?.toFixed(2) ?? "0.00"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8892B0]">PayPal</span>
              <span className="font-medium text-[#E2E8F0]">${stats?.revenuePayPal?.toFixed(2) ?? "0.00"}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1A1D27] flex overflow-hidden">
              {(() => {
                const q = stats?.revenueQvaPay || 0
                const t = stats?.revenueTransfer || 0
                const p = stats?.revenuePayPal || 0
                const total = q + t + p || 1
                return <>
                  <div className="h-full bg-[#7C8CFF]" style={{ width: `${(q/total)*100}%` }} />
                  <div className="h-full bg-[#4ADE80]" style={{ width: `${(t/total)*100}%` }} />
                  <div className="h-full bg-[#FBBF24]" style={{ width: `${(p/total)*100}%` }} />
                </>
              })()}
            </div>
            <div className="flex gap-2 text-[10px] text-[#5A6485]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7C8CFF]" />QvaPay</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4ADE80]" />Transf.</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FBBF24]" />PayPal</span>
            </div>
            <div className="pt-2 border-t border-[#2D3350]">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-[#E2E8F0]">Total</span>
                <span className="font-bold text-[#7C8CFF]">${stats?.revenue?.toFixed(2) ?? "0.00"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#22263A] border border-[#2D3350] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E2E8F0] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#7C8CFF]" />
            Distribución de Planes
          </h2>
          <div className="space-y-3">
            {Object.entries(planDistribution).map(([plan, count]) => {
              const total = Object.values(planDistribution).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={plan}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[#8892B0]">{getPlanLabel(plan)}</span>
                    <span className="text-sm font-medium text-[#E2E8F0]">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1A1D27]">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: adminAccent }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[#22263A] border border-[#2D3350] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E2E8F0] flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#7C8CFF]" />
            Tipos de Piel Detectados
          </h2>
          <div className="space-y-3">
            {Object.entries(skinTypeDistribution).sort(([, a], [, b]) => b - a).slice(0, 6).map(([type, count]) => {
              const total = Object.values(skinTypeDistribution).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={type}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[#8892B0] capitalize">{type}</span>
                    <span className="text-sm font-medium text-[#E2E8F0]">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1A1D27]">
                    <div className="h-full rounded-full bg-[#4ADE80]" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-[#22263A] border border-[#2D3350] rounded-xl p-5 mb-6">
        <h2 className="text-base font-semibold mb-4 text-[#E2E8F0] flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#7C8CFF]" />
          Acceso Rápido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {[
            { href: "/admin/users", label: "Usuarios", icon: Users },
            { href: "/admin/payments", label: "Pagos", icon: CreditCard },
            { href: "/admin/messages", label: "Mensajes", icon: MessageSquare },
            { href: "/admin/emails", label: "Correos", icon: Bell },
            { href: "/admin/support", label: "Soporte", icon: MessageCircle },
            { href: "/admin/blog", label: "Blog", icon: Newspaper },
            { href: "/admin/products", label: "Productos", icon: Package },
            { href: "/admin/guides", label: "Guías", icon: Download },
            { href: "/admin/transfers", label: "Transferencias", icon: ShieldCheck },
            { href: "/admin/feature-flags", label: "Features", icon: Settings },
            { href: "/admin/knowledge", label: "Conocimiento", icon: BookOpen },
            { href: "/admin/telegram", label: "Telegram", icon: MessageCircle },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-[#2D3350] transition-colors group">
                <item.icon className="w-4 h-4 text-[#7C8CFF]" />
                <span className="text-sm font-medium text-[#E2E8F0] group-hover:text-white transition-colors">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[#22263A] border border-[#2D3350] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E2E8F0] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#7C8CFF]" />
            Usuarios Recientes
          </h2>
          <div className="space-y-2">
            {recentUsers.length > 0 ? recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1A1D27]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#E2E8F0] truncate">{user.name || user.email}</p>
                  <p className="text-xs text-[#8892B0]">{user.email}</p>
                </div>
                <Badge variant={user.plan === "FREE" ? "secondary" : "primary"} className="text-[10px] bg-[#7C8CFF]/20 text-[#7C8CFF] border-0">
                  {getPlanLabel(user.plan)}
                </Badge>
              </div>
            )) : (
              <p className="text-sm text-[#8892B0] text-center py-4">Sin datos</p>
            )}
          </div>
        </div>

        <div className="bg-[#22263A] border border-[#2D3350] rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 text-[#E2E8F0] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#7C8CFF]" />
            Análisis Recientes
          </h2>
          <div className="space-y-2">
            {recentAnalyses.length > 0 ? recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1A1D27]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#E2E8F0] truncate">
                    {analysis.user.name || analysis.user.email}
                  </p>
                  <p className="text-xs text-[#8892B0]">
                    {analysis.skinType ? `Piel ${analysis.skinType}` : "Sin tipo"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
                  <span className="text-xs text-[#5A6485]">
                    {new Date(analysis.createdAt).toLocaleDateString("es")}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[#8892B0] text-center py-4">Sin datos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
