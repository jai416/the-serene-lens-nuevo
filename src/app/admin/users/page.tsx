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

interface User {
  id: string
  name: string | null
  email: string
  role: string
  plan: string
  createdAt: string
  _count: { analyses: number; payments: number }
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

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-[#64705E] dark:text-[#9BAA93]">Cargando...</p></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const updateUser = async (id: string, data: { role?: string; plan?: string }) => {
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

  return (
    <div className="min-h-screen bg-[#F8FAF5] dark:bg-[#1A1F19] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#64705E] dark:text-[#9BAA93] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6] inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="w-3 h-3" /> Volver al panel
          </Link>
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <Users className="w-3.5 h-3.5 mr-2" />
            Usuarios
          </Badge>
          <h1 className="font-serif text-3xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6]">
            Gestionar <span className="text-[#C2E09D]">Usuarios</span>
          </h1>
        </div>

        <Card className="border-[#DDE7D3] dark:border-[#3A4536] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDE7D3]/20 dark:border-[#3A4536]/20">
                  <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Usuario</th>
                  <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Email</th>
                  <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Rol</th>
                  <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Plan</th>
                  <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Análisis</th>
                  <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Pagos</th>
                  <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Registro</th>
                  <th className="text-left p-4 font-medium text-[#64705E] dark:text-[#9BAA93]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[#DDE7D3]/10 dark:border-[#3A4536]/10 hover:bg-[#F0F5EC] dark:hover:bg-[#2A3228] transition-colors">
                    <td className="p-4 font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">{user.name || "—"}</td>
                    <td className="p-4 text-[#64705E] dark:text-[#9BAA93]">{user.email}</td>
                    <td className="p-4">
                      <Badge className={user.role === "ADMIN" ? "bg-purple-500 text-white" : "bg-[#F0F5EC] dark:bg-[#2A3228] text-[#64705E] dark:text-[#9BAA93]"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.plan === "FREE" ? "outline" : "default"}>
                        {getPlanLabel(user.plan)}
                      </Badge>
                    </td>
                    <td className="p-4 text-[#2F3A2D] dark:text-[#E8EDE6]">{user._count.analyses}</td>
                    <td className="p-4 text-[#2F3A2D] dark:text-[#E8EDE6]">{user._count.payments}</td>
                    <td className="p-4 text-[#64705E] dark:text-[#9BAA93] text-xs">{formatDate(user.createdAt)}</td>
                    <td className="p-4">
                      {editing === user.id ? (
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => {
                              updateUser(user.id, { role: e.target.value })
                            }}
                            defaultValue={user.role}
                            className="text-xs rounded-lg border border-[#DDE7D3] dark:border-[#3A4536] bg-white dark:bg-[#222920] px-2 py-1 text-[#2F3A2D] dark:text-[#E8EDE6]"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <select
                            onChange={(e) => {
                              updateUser(user.id, { plan: e.target.value })
                            }}
                            defaultValue={user.plan}
                            className="text-xs rounded-lg border border-[#DDE7D3] dark:border-[#3A4536] bg-white dark:bg-[#222920] px-2 py-1 text-[#2F3A2D] dark:text-[#E8EDE6]"
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
      </div>
    </div>
  )
}
