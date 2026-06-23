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
  Calendar, Sparkles, CheckCircle2, Clock
} from "lucide-react"
import { toast } from "sonner"

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
  analysesThisMonth: number
  conversionRate: number
  paidUsers: number
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

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/admin/stats")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (d?.stats) {
            setStats(d.stats)
            setRecentUsers(d.recentUsers || [])
            setRecentAnalyses(d.recentAnalyses || [])
            setPlanDistribution(d.planDistribution || {})
          }
        })
        .catch(() => toast.error("Error al cargar estadísticas"))
    }
  }, [session])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const mainCards = [
    { label: "Usuarios Totales", value: stats?.users ?? "—", icon: Users, href: "/admin/users", color: "bg-[#2F3A2D]", trend: `+${stats?.newUsersThisWeek ?? 0} esta semana` },
    { label: "Análisis Totales", value: stats?.analyses ?? "—", icon: Activity, href: "/admin", color: "bg-[#C2E09D]", trend: `${stats?.analysesThisMonth ?? 0} este mes` },
    { label: "Ingresos Totales", value: stats?.revenue ? `$${stats.revenue.toFixed(2)}` : "$0", icon: DollarSign, href: "/admin/payments", color: "bg-emerald-600", trend: `${stats?.analysesThisMonth ?? 0} este mes` },
    { label: "Mensajes", value: stats?.messages ?? "—", icon: MessageSquare, href: "/admin/messages", color: "bg-purple-600", trend: `${stats?.unreadMessages ?? 0} sin leer` },
  ]

  const metricCards = [
    { label: "Activos (7 días)", value: stats?.activeUsers ?? "—", icon: UserPlus, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Nuevos (30 días)", value: stats?.newUsersThisMonth ?? "—", icon: Calendar, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Tasa Conversión", value: stats?.conversionRate ? `${stats.conversionRate}%` : "0%", icon: TrendingUp, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Pagos Pendientes", value: stats?.pendingPayments ?? "—", icon: Clock, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Blog Posts", value: stats?.posts ?? "—", icon: Newspaper, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Productos", value: stats?.products ?? "—", icon: Package, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Usuarios Premium", value: stats?.paidUsers ?? "—", icon: Sparkles, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
    { label: "Ingresos QvaPay", value: stats?.revenueQvaPay ? `$${stats.revenueQvaPay.toFixed(2)}` : "$0", icon: BarChart3, color: "text-[#2F3A2D] dark:text-[#C2E09D]" },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
            Admin Panel
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6]">
            Panel de <span className="gradient-text">Administración</span>
          </h1>
        </div>

        {/* Main Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mainCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="transition-all duration-200 group hover:shadow-[0_8px_24px_rgba(47,58,45,0.1)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#8A9A82] dark:text-[#7A8A72] group-hover:text-[#2F3A2D] dark:group-hover:text-[#E8EDE6] transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-[#2F3A2D] dark:text-[#E8EDE6]">{card.value}</p>
                  <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">{card.label}</p>
                  {card.trend && (
                    <p className="text-[10px] text-[#8A9A82] dark:text-[#7A8A72] mt-1">{card.trend}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {metricCards.map((card) => (
            <Card key={card.label} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                  <span className="text-xs text-[#64705E] dark:text-[#9BAA93]">{card.label}</span>
                </div>
                <p className="text-xl font-bold text-[#2F3A2D] dark:text-[#E8EDE6]">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Breakdown */}
          <Card className="p-5">
            <h2 className="font-serif text-lg font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#2F3A2D] dark:text-[#C2E09D]" />
              Ingresos por Proveedor
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64705E] dark:text-[#9BAA93]">QvaPay</span>
                <span className="font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">${stats?.revenueQvaPay?.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F0F5EC] dark:bg-[#2E3829]">
                <div className="h-full rounded-full bg-[#C2E09D]" style={{ width: "100%" }} />
              </div>
              <div className="pt-2 border-t border-[#DDE7D3] dark:border-[#3A4536]">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">Total</span>
                  <span className="font-bold text-[#2F3A2D] dark:text-[#E8EDE6]">${stats?.revenue?.toFixed(2) ?? "0.00"}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Plan Distribution */}
          <Card className="p-5">
            <h2 className="font-serif text-lg font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#2F3A2D] dark:text-[#C2E09D]" />
              Distribución de Planes
            </h2>
            <div className="space-y-3">
              {Object.entries(planDistribution).map(([plan, count]) => {
                const total = Object.values(planDistribution).reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={plan}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[#64705E] dark:text-[#9BAA93]">{plan}</span>
                      <span className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F0F5EC] dark:bg-[#2E3829]">
                      <div className="h-full rounded-full bg-[#C2E09D]" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Quick Links */}
          <Card className="p-5">
            <h2 className="font-serif text-lg font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2F3A2D] dark:text-[#C2E09D]" />
              Acceso Rápido
            </h2>
            <div className="space-y-2">
              {[
                { href: "/admin/users", label: "Gestionar Usuarios", icon: Users },
                { href: "/admin/payments", label: "Ver Pagos", icon: CreditCard },
                { href: "/admin/messages", label: "Mensajes Recibidos", icon: MessageSquare },
                { href: "/admin/blog", label: "Administrar Blog", icon: Newspaper },
                { href: "/admin/products", label: "Administrar Productos", icon: Package },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAF5] dark:hover:bg-[#2A3228] transition-colors group">
                    <item.icon className="w-4 h-4 text-[#C2E09D]" />
                    <span className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6] group-hover:text-[#2F3A2D] dark:group-hover:text-[#C2E09D] transition-colors">{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 text-[#8A9A82] dark:text-[#7A8A72] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Recent Users */}
          <Card className="p-5">
            <h2 className="font-serif text-lg font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#2F3A2D] dark:text-[#C2E09D]" />
              Usuarios Recientes
            </h2>
            <div className="space-y-3">
              {recentUsers.length > 0 ? recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF5] dark:bg-[#1E251C]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6] truncate">{user.name || user.email}</p>
                    <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">{user.email}</p>
                  </div>
                  <Badge variant={user.plan === "FREE" ? "secondary" : "primary"} className="text-[10px]">
                    {user.plan}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-[#64705E] dark:text-[#9BAA93] text-center py-4">Sin datos</p>
              )}
            </div>
          </Card>

          {/* Recent Analyses */}
          <Card className="p-5">
            <h2 className="font-serif text-lg font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2F3A2D] dark:text-[#C2E09D]" />
              Análisis Recientes
            </h2>
            <div className="space-y-3">
              {recentAnalyses.length > 0 ? recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF5] dark:bg-[#1E251C]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#2F3A2D] dark:text-[#E8EDE6] truncate">
                      {analysis.user.name || analysis.user.email}
                    </p>
                    <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">
                      {analysis.skinType ? `Piel ${analysis.skinType}` : "Sin tipo"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C2E09D]" />
                    <span className="text-xs text-[#8A9A82] dark:text-[#7A8A72]">
                      {new Date(analysis.createdAt).toLocaleDateString("es")}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[#64705E] dark:text-[#9BAA93] text-center py-4">Sin datos</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
