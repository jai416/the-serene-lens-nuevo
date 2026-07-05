"use client"

import { useSession, signOut } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Save, AlertCircle, Trash2, LogOut } from "lucide-react"
import { toast } from "sonner"
import { ProfileSkeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
  const pathname = usePathname()
  const { data: session, status, update } = useSession()
  const [name, setName] = useState(session?.user?.name || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (status === "loading") {
    return <ProfileSkeleton />
  }

  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) throw new Error("Error al guardar")

      await update()
      setSuccess(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar la cuenta")
      toast.success("Cuenta eliminada")
      await signOut({ callbackUrl: "/" })
    } catch {
      toast.error("No se pudo eliminar la cuenta")
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <User className="w-3.5 h-3.5 mr-2" />
            Perfil
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D3229]">
            Mi Perfil
          </h1>
        </div>

        <Card className="p-6">
          <CardContent className="p-0 space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-[#3D3229]">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#E8DDD0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E8D5C4] text-[#3D3229]"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-[#3D3229]">Email</label>
              <input
                type="email"
                value={session.user.email || ""}
                disabled
                className="w-full rounded-xl border border-[#E8DDD0] bg-[#F0F5EC] px-4 py-2.5 text-sm text-[#8A7A6A] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-[#3D3229]">Plan</label>
              <input
                type="text"
                value={(session.user as any).plan === "PREMIUM" ? "Premium" : (session.user as any).plan === "PRO" ? "Pro" : "Gratuito"}
                disabled
                className="w-full rounded-xl border border-[#E8DDD0] bg-[#F0F5EC] px-4 py-2.5 text-sm text-[#8A7A6A] cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#E07070]">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <p className="text-sm text-[#3D3229]">Perfil actualizado</p>
            )}

            <Button onClick={handleSave} disabled={saving} variant="primary">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        {/* ── Cerrar sesión ── */}
        <Card className="p-6 mt-6">
          <CardContent className="p-0">
            <p className="text-sm text-[#8A7A6A] mb-4">
              Cierra sesión en este dispositivo. Podrás volver a iniciar sesión cuando quieras.
            </p>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>

        {/* ── Eliminar cuenta ── */}
        <Card className="p-6 mt-6 border-[#FECACA]">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="flex items-center gap-2 text-base text-[#E07070]">
              <Trash2 className="w-4 h-4" />
              Eliminar cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-sm text-[#8A7A6A] mb-4">
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
