"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft } from "lucide-react"
import { formatDate } from "@/lib/utils"
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

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>
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
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="w-3 h-3" /> Volver al panel
          </Link>
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <Users className="w-3.5 h-3.5 mr-2" />
            Usuarios
          </Badge>
          <h1 className="font-serif text-3xl font-semibold">
            Gestionar <span className="gradient-text">Usuarios</span>
          </h1>
        </div>

        <Card className="border-[#DDE7D3] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline/20">
                  <th className="text-left p-4 font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Rol</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Análisis</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Pagos</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Registro</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-outline/10 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{user.name || "—"}</td>
                    <td className="p-4 text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <Badge className={user.role === "ADMIN" ? "bg-purple-500" : "bg-muted text-muted-foreground"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.plan === "FREE" ? "outline" : "default"}>
                        {user.plan === "PRO" ? "Pro" : user.plan === "PREMIUM" ? "Premium" : user.plan}
                      </Badge>
                    </td>
                    <td className="p-4">{user._count.analyses}</td>
                    <td className="p-4">{user._count.payments}</td>
                    <td className="p-4 text-muted-foreground text-xs">{formatDate(user.createdAt)}</td>
                    <td className="p-4">
                      {editing === user.id ? (
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => {
                              updateUser(user.id, { role: e.target.value })
                            }}
                            defaultValue={user.role}
                            className="text-xs rounded-lg border border-input bg-background px-2 py-1"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <select
                            onChange={(e) => {
                              updateUser(user.id, { plan: e.target.value })
                            }}
                            defaultValue={user.plan}
                            className="text-xs rounded-lg border border-input bg-background px-2 py-1"
                          >
                            <option value="FREE">FREE</option>
                            <option value="PREMIUM">PREMIUM</option>
                            <option value="PRO">PRO</option>
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
