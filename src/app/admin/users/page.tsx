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
  ADMIN: "#FB7185",
  VALIDATOR: "#7C8CFF",
  USER: "#8892B0",
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

  const adminText = "text-[#E2E8F0]"
  const adminSecondary = "text-[#8892B0]"
  const adminMuted = "text-[#5A6485]"
  const adminCard = "bg-[#22263A] border-[#2D3350]"
  const adminAccent = "#7C8CFF"

  return (
    <div className="overflow-x-hidden">
      <div className="mb-8">
        <Link href="/admin" className="text-xs text-[#8892B0] hover:text-[#E2E8F0] inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Volver al panel
        </Link>
        <Badge className="bg-[#7C8CFF]/20 text-[#7C8CFF] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
          <Users className="w-3 h-3 mr-1.5" />
          Usuarios
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#E2E8F0] mt-3">
          Gestionar <span style={{ color: adminAccent }}>Usuarios</span>
        </h1>
        <p className="text-sm text-[#8892B0] mt-1">{users.length} usuarios registrados</p>
      </div>

      <Card style={{ backgroundColor: "#22263A", borderColor: "#2D3350" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#2D3350" }}>
                <th className="text-left p-4 font-medium text-[#8892B0]">Usuario</th>
                <th className="text-left p-4 font-medium text-[#8892B0]">Email</th>
                <th className="text-left p-4 font-medium text-[#8892B0]">Rol</th>
                <th className="text-left p-4 font-medium text-[#8892B0]">Plan</th>
                <th className="text-left p-4 font-medium text-[#8892B0]">Telegram</th>
                <th className="text-left p-4 font-medium text-[#8892B0]">Análisis</th>
                <th className="text-left p-4 font-medium text-[#8892B0]">Registro</th>
                <th className="text-left p-4 font-medium text-[#8892B0]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b transition-colors hover:bg-[#2D3350]/50" style={{ borderColor: "#2D3350" }}>
                  <td className="p-4 font-medium text-[#E2E8F0]">{user.name || "—"}</td>
                  <td className="p-4 text-[#8892B0]">{user.email}</td>
                  <td className="p-4">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${roleColors[user.role] || "#8892B0"}20`, color: roleColors[user.role] || "#8892B0" }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#2D3350", color: "#8892B0" }}>
                      {getPlanLabel(user.plan)}
                    </span>
                  </td>
                  <td className="p-4 text-[10px] text-[#5A6485]">{user.telegramId ? `@${user.telegramId}` : "—"}</td>
                  <td className="p-4 text-[#8892B0]">{user._count.analyses}</td>
                  <td className="p-4 text-[#5A6485] text-xs">{formatDate(user.createdAt)}</td>
                  <td className="p-4">
                    {editing === user.id ? (
                      <div className="flex gap-2">
                        <select
                          onChange={(e) => updateUser(user.id, { role: e.target.value })}
                          defaultValue={user.role}
                          className="text-xs rounded-lg px-2 py-1"
                          style={{ backgroundColor: "#2D3350", border: "1px solid #3D4270", color: "#E2E8F0" }}
                        >
                          <option value="USER">USER</option>
                          <option value="VALIDATOR">VALIDATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <select
                          onChange={(e) => updateUser(user.id, { plan: e.target.value })}
                          defaultValue={user.plan}
                          className="text-xs rounded-lg px-2 py-1"
                          style={{ backgroundColor: "#2D3350", border: "1px solid #3D4270", color: "#E2E8F0" }}
                        >
                          <option value="FREE">FREE</option>
                          <option value="PREMIUM">PREMIUM</option>
                          <option value="PRO">PRO</option>
                          <option value="PRO_PLUS">PRO+</option>
                          <option value="ESTHETICIAN">ESTHETICIAN</option>
                        </select>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(user.id)}
                        style={{ color: "#7C8CFF" }}
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
      <Card className="mt-4" style={{ backgroundColor: "#22263A", borderColor: "#2D3350" }}>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-[#E2E8F0] mb-2">¿Qué hace un Validador?</h3>
          <p className="text-xs text-[#8892B0]">
            Los validadores pueden verificar y activar pagos por Transfermóvil desde el panel admin.
            También tienen acceso al bot de Telegram con el menú de validador.
            Este rol es ideal para personal de confianza que ayuda con la gestión de pagos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
