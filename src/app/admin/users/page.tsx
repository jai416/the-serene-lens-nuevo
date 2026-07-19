"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft } from "lucide-react"
import { formatDate, getPlanLabel } from "@/lib/utils"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  plan: string
  createdAt: string
  telegramId: string | null
  _count: { analyses: number; payments: number }
}

const roleColors: Record<string, string> = {
  ADMIN: "#E07070",
  VALIDATOR: "#88B078",
  USER: "#666666",
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/admin/users")
        .then((r) => r.ok ? r.json() : { data: { users: [] } })
        .then((d) => setUsers(d?.data?.users || d.users || []))
        .catch(() => toast.error("Error al cargar usuarios"))
    }
  }, [session])

  if (status === "loading") return <div className="flex items-center justify-center py-20"><ListSkeleton rows={5} /></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const updateUser = async (id: string, data: { role?: string; plan?: string; telegramId?: string | null }) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })
      if (res.ok) {
        setUsers(users.map((u) => (u.id === id ? { ...u, ...data } : u)))
        toast.success("Usuario actualizado")
      } else {
        toast.error("Error al actualizar usuario")
      }
    } catch {
      toast.error("Error al actualizar usuario")
    }
    setEditing(null)
  }

  const adminText = "text-[#1A1A1A]"
  const adminSecondary = "text-[#666666]"
  const adminMuted = "text-[#666666]"
  const adminCard = "bg-white border-[#E8E8E8]"
  const adminAccent = "#88B078"

  return (
    <div className="overflow-x-hidden">
      <div className="mb-8">
          <Link href="/admin" className="text-xs text-[#666666] hover:text-[#1A1A1A] inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Volver al panel
        </Link>
        <Badge className="bg-[#88B078]/20 text-[#88B078] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
          <Users className="w-3 h-3 mr-1.5" />
          Usuarios
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-3">
          Gestionar <span style={{ color: adminAccent }}>Usuarios</span>
        </h1>
        <p className="text-sm text-[#666666] mt-1">{users.length} usuarios registrados</p>
      </div>

      <Card style={{ backgroundColor: "white", borderColor: "#E8E8E8" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#E8E8E8" }}>
                <th className="text-left p-4 font-medium text-[#666666]">Usuario</th>
                <th className="text-left p-4 font-medium text-[#666666]">Email</th>
                <th className="text-left p-4 font-medium text-[#666666]">Rol</th>
                <th className="text-left p-4 font-medium text-[#666666]">Plan</th>
                <th className="text-left p-4 font-medium text-[#666666]">Telegram</th>
                <th className="text-left p-4 font-medium text-[#666666]">Análisis</th>
                <th className="text-left p-4 font-medium text-[#666666]">Registro</th>
                <th className="text-left p-4 font-medium text-[#666666]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b transition-colors hover:bg-[#F0F0F0]/50" style={{ borderColor: "#E8E8E8" }}>
                  <td className="p-4 font-medium text-[#1A1A1A]">{user.name || "—"}</td>
                  <td className="p-4 text-[#666666]">{user.email}</td>
                  <td className="p-4">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${roleColors[user.role] || "#8892B0"}20`, color: roleColors[user.role] || "#8892B0" }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#E8E8E8", color: "#666666" }}>
                      {getPlanLabel(user.plan)}
                    </span>
                  </td>
                  <td className="p-4 text-[10px] text-[#666666]">{user.telegramId ? `@${user.telegramId}` : "—"}</td>
                  <td className="p-4 text-[#666666]">{user._count.analyses}</td>
                  <td className="p-4 text-[#666666] text-xs">{formatDate(user.createdAt)}</td>
                  <td className="p-4">
                    {editing === user.id ? (
                      <div className="flex gap-2">
                        <select
                          onChange={(e) => updateUser(user.id, { role: e.target.value })}
                          defaultValue={user.role}
                          className="text-xs rounded-lg px-2 py-1"
                          style={{ backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8", color: "#1A1A1A" }}
                        >
                          <option value="USER">USER</option>
                          <option value="VALIDATOR">VALIDATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <select
                          onChange={(e) => updateUser(user.id, { plan: e.target.value })}
                          defaultValue={user.plan}
                          className="text-xs rounded-lg px-2 py-1"
                          style={{ backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8", color: "#1A1A1A" }}
                        >
                          <option value="FREE">FREE</option>
                          <option value="PREMIUM">PREMIUM</option>
                          <option value="PREMIUM_ANNUAL">PREMIUM ANUAL</option>
                          <option value="PRO">PRO</option>
                          <option value="PRO_ANNUAL">PRO ANUAL</option>
                          <option value="PRO_PLUS">PRO+</option>
                          <option value="PRO_PLUS_ANNUAL">PRO+ ANUAL</option>
                          <option value="ESTHETICIAN">ESTHETICIAN</option>
                          <option value="ESTHETICIAN_ANNUAL">ESTHETICIAN ANUAL</option>
                        </select>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(user.id)}
                        style={{ color: "#88B078" }}
                      >
                        Editar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Validator info */}
      <Card className="mt-4" style={{ backgroundColor: "white", borderColor: "#E8E8E8" }}>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">¿Qué hace un Validador?</h3>
          <p className="text-xs text-[#666666]">
            Los validadores pueden verificar y activar pagos por Transfermóvil desde el panel admin.
            También tienen acceso al bot de Telegram con el menú de validador.
            Este rol es ideal para personal de confianza que ayuda con la gestión de pagos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
