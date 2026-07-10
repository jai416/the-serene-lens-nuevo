"use client"

import { useSession, signOut } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User, Scan, History, Beaker, TrendingUp, Crown, Trash2, LogOut,
  Save, AlertCircle, ChevronRight, BookOpen, Trophy,
  Package, Bookmark, HelpCircle, FileText, Settings, Sun, Bell,
} from "lucide-react"
import { toast } from "sonner"
import { ProfileSkeleton } from "@/components/ui/skeleton"

const PLAN_LABELS: Record<string, string> = {
  FREE: "Essential",
  PREMIUM: "Premium",
  PRO: "Pro",
  PRO_PLUS: "Pro+",
  ESTHETICIAN: "Esteticista",
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "#666666",
  PREMIUM: "#88B078",
  PRO: "#88B078",
  PRO_PLUS: "#D4A843",
  ESTHETICIAN: "#D4A843",
}

const quickActions = [
  { label: "Nuevo análisis", icon: Scan, href: "/analysis", desc: "Escanea tu piel con IA" },
  { label: "Historial", icon: History, href: "/dashboard/history", desc: "Tus análisis anteriores" },
  { label: "Rutinas", icon: BookOpen, href: "/dashboard/diary", desc: "Diario de cuidado facial" },
  { label: "Desafíos", icon: Trophy, href: "/dashboard/challenges", desc: "Metas de cuidado" },
  { label: "Productos", icon: Package, href: "/products", desc: "Catálogo recomendado" },
  { label: "Ingredientes", icon: Beaker, href: "/ingredients-analyzer", desc: "Analiza productos" },
  { label: "Guías", icon: Bookmark, href: "/dashboard/guides", desc: "Material educativo" },
  { label: "Soporte", icon: HelpCircle, href: "/dashboard/support", desc: "Ayuda y contacto" },
]

export default function ProfilePage() {
  const pathname = usePathname()
  const { data: session, status, update } = useSession()
  const user = session?.user as any
  const plan = user?.plan || "FREE"
  const [name, setName] = useState(user?.name || "")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (status === "loading") return <ProfileSkeleton />
  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const handleSave = async () => {
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      await update()
      toast.success("Perfil actualizado")
    } catch {
      setSaveError("Error al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Cuenta eliminada")
      signOut({ callbackUrl: "/" })
    } catch {
      toast.error("No se pudo eliminar la cuenta")
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8 bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Hero Header ── */}
        <Card className="p-6 md:p-8 border-0 shadow-[0_2px_16px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#E2ECE0]/40" />
          <div className="absolute -bottom-10 -right-8 w-32 h-32 rounded-full bg-[#E2ECE0]/30" />
          <CardContent className="p-0 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#88B078] flex items-center justify-center text-2xl font-bold text-white shadow-sm shrink-0">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#1A1A1A] truncate">
                    {user.name || "Usuario"}
                  </h1>
                  <Badge
                    className="rounded-full px-3 py-0.5 text-xs font-medium shrink-0"
                    style={{
                      backgroundColor: plan === "FREE" ? "#F8F9FA" : plan === "ESTHETICIAN" || plan === "PRO_PLUS" ? "#FFF9E6" : "#E2ECE0",
                      color: PLAN_COLORS[plan] || "#666666",
                      border: plan === "FREE" ? "1px solid #E8E8E8" : "none",
                    }}
                  >
                    {PLAN_LABELS[plan] || "Essential"}
                  </Badge>
                </div>
                <p className="text-sm text-[#666666]">{user.email}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Plan", value: PLAN_LABELS[plan] || "Essential", icon: Crown, color: PLAN_COLORS[plan] || "#666666" },
            { label: "Análisis", value: "—", icon: Scan, color: "#88B078" },
            { label: "Progreso", value: "—", icon: TrendingUp, color: "#88B078" },
            { label: "Estado", value: "Activo", icon: User, color: "#88B078" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 border border-[#E8E8E8]/60">
              <CardContent className="p-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E2ECE0] flex items-center justify-center shrink-0">
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#666666]">{stat.label}</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Quick Actions Grid ── */}
        <div>
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Acceso rápido</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="p-4 hover:-translate-y-0.5 transition-all duration-200 border border-[#E8E8E8]/60 cursor-pointer h-full">
                  <CardContent className="p-0">
                    <div className="w-10 h-10 rounded-xl bg-[#E2ECE0] flex items-center justify-center mb-3">
                      <action.icon className="w-5 h-5 text-[#88B078]" />
                    </div>
                    <p className="text-sm font-semibold text-[#1A1A1A] mb-0.5">{action.label}</p>
                    <p className="text-xs text-[#666666]">{action.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Plan Card ── */}
        <Card className="p-6 border border-[#E8E8E8]/60">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E2ECE0] flex items-center justify-center">
                  <Crown className="w-6 h-6" style={{ color: PLAN_COLORS[plan] || "#666666" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A]">Plan {PLAN_LABELS[plan] || "Essential"}</h3>
                  <p className="text-xs text-[#666666]">
                    {plan === "ESTHETICIAN" ? "Acceso profesional ilimitado" :
                     plan === "PRO_PLUS" ? "Análisis ilimitados + informes PDF" :
                     plan === "PRO" ? "5 análisis por mes + rutina dinámica" :
                     plan === "PREMIUM" ? "3 análisis por mes" :
                     "1 análisis gratis por mes"}
                  </p>
                </div>
              </div>
              <Link href="/dashboard/subscription">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  Gestionar <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            {plan !== "ESTHETICIAN" && plan !== "PRO_PLUS" && (
              <Link href="/pricing">
                <Button size="sm" className="text-xs w-full">
                  Mejorar plan
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* ── Account Settings ── */}
        <Card className="p-6 border border-[#E8E8E8]/60">
          <CardContent className="p-0 space-y-5">
            <h3 className="font-semibold text-base text-[#1A1A1A] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#88B078]" />
              Configuración de la cuenta
            </h3>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-[#1A1A1A]">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#88B078] text-[#1A1A1A]"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-[#1A1A1A]">Email</label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full rounded-xl border border-[#E8E8E8] bg-[#E2ECE0] px-4 py-2.5 text-sm text-[#666666] cursor-not-allowed"
              />
            </div>

            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#E07070]">
                <AlertCircle className="w-4 h-4" />
                {saveError}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} variant="primary">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        {/* ── Esthetician Section ── */}
        {plan === "ESTHETICIAN" && (
          <Card className="p-6 border border-[#FCEAA6] bg-[#FFF9E6]">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FCEAA6] flex items-center justify-center">
                  <User className="w-6 h-6 text-[#D4A843]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A]">Panel Esteticista</h3>
                  <p className="text-xs text-[#666666]">Herramientas profesionales para tu clínica</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <Link href="/dashboard/esthetician">
                  <Card className="p-4 border border-[#E8E8E8]/60 bg-white hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-0 flex items-center gap-3">
                      <Settings className="w-5 h-5 text-[#D4A843]" />
                      <span className="text-sm font-medium text-[#1A1A1A]">Gestionar pacientes</span>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dashboard/report">
                  <Card className="p-4 border border-[#E8E8E8]/60 bg-white hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-0 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#D4A843]" />
                      <span className="text-sm font-medium text-[#1A1A1A]">Informes profesionales</span>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Danger Zone ── */}
        <Card className="p-6 border border-[#FECACA]">
          <CardContent className="p-0">
            <h3 className="font-semibold text-base text-[#E07070] flex items-center gap-2 mb-4">
              <Trash2 className="w-4 h-4" />
              Eliminar cuenta
            </h3>
            <p className="text-sm text-[#666666] mb-4">
              Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.
            </p>
            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </Button>
                <Button variant="outline" size="sm" className="border-[#E07070] text-[#E07070] hover:bg-[#FEF2F2]" onClick={handleDeleteAccount}>
                  Confirmar eliminación
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="border-[#E07070] text-[#E07070] hover:bg-[#FEF2F2]" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4 mr-1.5" />
                Eliminar mis datos
              </Button>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
