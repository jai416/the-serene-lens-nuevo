"use client"

import { useSession, signOut } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"
import {
  Crown, Trash2, LogOut, Save, AlertCircle, User, Mail, Calendar, Activity,
} from "lucide-react"
import { toast } from "sonner"

const PLAN_LABELS: Record<string, { en: string; es: string }> = {
  FREE: { en: "Essential", es: "Essential" },
  PREMIUM: { en: "Premium", es: "Premium" },
  PRO: { en: "Pro", es: "Pro" },
  PRO_PLUS: { en: "Pro+", es: "Pro+" },
  ESTHETICIAN: { en: "Esthetician", es: "Esteticista" },
}

export default function ProfilePage() {
  const pathname = usePathname()
  const { data: session, status, update } = useSession()
  const { locale } = useLocale()
  const user = session?.user as any
  const plan = user?.plan || "FREE"
  const planLabel = PLAN_LABELS[plan]?.[locale] || PLAN_LABELS[plan]?.en || plan
  const [name, setName] = useState(user?.name || "")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [showDelete, setShowDelete] = useState(false)

  if (status === "loading") return <div className="p-8 text-center text-[#666666]">Cargando...</div>
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
      if (!res.ok) throw new Error()
      await update()
      toast.success(t("profile.saved", locale))
    } catch {
      setSaveError("Error al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
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
      <div className="max-w-2xl mx-auto space-y-5">

        {/* User Card */}
        <Card className="p-6 border-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#88B078] flex items-center justify-center text-xl font-bold text-white shrink-0">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="font-serif text-xl font-semibold text-[#1A1A1A] truncate">
                    {user.name || "Usuario"}
                  </h1>
                  <Badge className="rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0 bg-[#E2ECE0] text-[#88B078] border-0">
                    {planLabel}
                  </Badge>
                </div>
                <p className="text-sm text-[#666666]">{user.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="w-3.5 h-3.5 mr-1" />
                {locale === "en" ? "Sign Out" : "Salir"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Table */}
        <Card className="p-0 border border-[#E8E8E8]/60 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-[#E8E8E8]/50">
                <td className="py-3.5 px-5 text-[#666666] flex items-center gap-2">
                  <User className="w-4 h-4" /> {t("profile.name", locale)}
                </td>
                <td className="py-3.5 px-5 text-[#1A1A1A] font-medium">{user.name || "—"}</td>
              </tr>
              <tr className="border-b border-[#E8E8E8]/50">
                <td className="py-3.5 px-5 text-[#666666] flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {t("profile.email", locale)}
                </td>
                <td className="py-3.5 px-5 text-[#1A1A1A] font-medium">{user.email}</td>
              </tr>
              <tr className="border-b border-[#E8E8E8]/50">
                <td className="py-3.5 px-5 text-[#666666] flex items-center gap-2">
                  <Crown className="w-4 h-4" /> {t("profile.plan", locale)}
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#1A1A1A]">{planLabel}</span>
                    <Link href="/dashboard/subscription">
                      <Button variant="ghost" size="sm" className="text-xs">
                        {t("plan.manage", locale)}
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[#E8E8E8]/50">
                <td className="py-3.5 px-5 text-[#666666] flex items-center gap-2">
                  <Activity className="w-4 h-4" /> {t("profile.analyses", locale)}
                </td>
                <td className="py-3.5 px-5 text-[#1A1A1A] font-medium">
                  <Link href="/dashboard/history" className="text-[#88B078] hover:underline">
                    Ver historial
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 text-[#666666] flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {t("profile.registered", locale)}
                </td>
                <td className="py-3.5 px-5 text-[#1A1A1A] font-medium">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
                        year: "numeric", month: "long", day: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* Language */}
        <Card className="p-5 border border-[#E8E8E8]/60">
          <CardContent className="p-0 flex items-center justify-between">
            <span className="text-sm font-medium text-[#1A1A1A]">{t("profile.language", locale)}</span>
            <LocaleSwitcher />
          </CardContent>
        </Card>

        {/* Edit Name */}
        <Card className="p-5 border border-[#E8E8E8]/60">
          <CardContent className="p-0 space-y-4">
            <label className="text-sm font-medium text-[#1A1A1A]">{t("profile.name", locale)}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#88B078] text-[#1A1A1A]"
              placeholder={locale === "en" ? "Your name" : "Tu nombre"}
            />
            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#E07070]">
                <AlertCircle className="w-4 h-4" />
                {saveError}
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} variant="primary" size="sm">
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? t("profile.saving", locale) : t("profile.save", locale)}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="p-5 border border-[#FECACA]">
          <CardContent className="p-0">
            <h3 className="font-semibold text-sm text-[#E07070] flex items-center gap-2 mb-3">
              <Trash2 className="w-4 h-4" />
              {t("profile.deleteAccount", locale)}
            </h3>
            <p className="text-sm text-[#666666] mb-4">{t("profile.deleteWarning", locale)}</p>
            {showDelete ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDelete(false)}>
                  {t("profile.cancel", locale)}
                </Button>
                <Button variant="outline" size="sm" className="border-[#E07070] text-[#E07070] hover:bg-[#FEF2F2]" onClick={handleDelete}>
                  {t("profile.confirmDelete", locale)}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="border-[#E07070] text-[#E07070] hover:bg-[#FEF2F2]" onClick={() => setShowDelete(true)}>
                <Trash2 className="w-4 h-4 mr-1.5" />
                {t("profile.deleteAccount", locale)}
              </Button>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
