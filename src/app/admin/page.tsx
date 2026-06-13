"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users, CreditCard, MessageSquare, Newspaper, Package, DollarSign, Activity, Eye, TrendingUp } from "lucide-react"
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
  revenueStripe: number
  revenueQvaPay: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/admin/stats")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => setStats(d?.stats || null))
        .catch(() => toast.error("Error al cargar estadísticas"))
    }
  }, [session])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const cards = [
    { label: "Usuarios", value: stats?.users ?? "—", icon: Users, href: "/admin/users", color: "bg-blue-500" },
    { label: "Pagos Completados", value: stats?.completedPayments ?? "—", icon: CreditCard, href: "/admin/payments", color: "bg-green-500" },
    { label: "Ingresos", value: stats?.revenue ? `$${stats.revenue.toFixed(2)}` : "$0", icon: DollarSign, href: "/admin/payments", color: "bg-emerald-500" },
    { label: "Mensajes", value: stats?.messages ?? "—", icon: MessageSquare, href: "/admin/messages", color: "bg-purple-500" },
    { label: "Análisis", value: stats?.analyses ?? "—", icon: Activity, href: "/admin", color: "bg-amber-500" },
    { label: "Blog Posts", value: stats?.posts ?? "—", icon: Newspaper, href: "/admin/blog", color: "bg-rose-500" },
    { label: "Productos", value: stats?.products ?? "—", icon: Package, href: "/admin/products", color: "bg-teal-500" },
    { label: "No leídos", value: stats?.unreadMessages ?? "—", icon: Eye, href: "/admin/messages", color: "bg-red-500" },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
            Admin Panel
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
            Panel de <span className="gradient-text">Administración</span>
          </h1>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="border-[rgba(255,255,255,0.25)] transition-all duration-200 group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5 border-[rgba(255,255,255,0.25)]">
            <div>
              <h2 className="font-serif text-lg font-semibold mb-4">Acceso Rápido</h2>
              <div className="space-y-2">
                {[
                  { href: "/admin/users", label: "Gestionar Usuarios", icon: Users },
                  { href: "/admin/payments", label: "Ver Pagos", icon: CreditCard },
                  { href: "/admin/messages", label: "Mensajes Recibidos", icon: MessageSquare },
                  { href: "/admin/blog", label: "Administrar Blog", icon: Newspaper },
                  { href: "/admin/products", label: "Administrar Productos", icon: Package },
                ].map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                      <item.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5 border-[rgba(255,255,255,0.25)]">
            <div>
              <h2 className="font-serif text-lg font-semibold mb-4">Resumen Rápido</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuarios registrados</span>
                  <span className="font-medium">{stats?.users ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagos pendientes</span>
                  <span className="font-medium">{stats?.pendingPayments ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mensajes sin leer</span>
                  <span className="font-medium">{stats?.unreadMessages ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Análisis realizados</span>
                  <span className="font-medium">{stats?.analyses ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos totales</span>
                  <span className="font-medium">${stats?.revenue?.toFixed(2) ?? "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos Stripe</span>
                  <span className="font-medium">${stats?.revenueStripe?.toFixed(2) ?? "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos QvaPay</span>
                  <span className="font-medium">${stats?.revenueQvaPay?.toFixed(2) ?? "0.00"}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
