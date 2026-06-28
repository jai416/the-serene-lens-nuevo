"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users, Plus, Loader2, Trash2, User, Mail, Phone,
  FileText, ArrowRight, Shield, BarChart3, Download,
} from "lucide-react"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  createdAt: string
}

export default function EstheticianDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" })

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/user/clients")
      const data = await res.json()
      setClients(data?.data?.clients || [])
    } catch {
      toast.error("Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login?callbackUrl=/dashboard/esthetician")
      return
    }
    if (session.user.plan !== "ESTHETICIAN" && session.user.role !== "ADMIN") {
      router.push("/pricing")
      return
    }
    loadClients()
  }, [session, status, router, loadClients])

  const handleCreate = async () => {
    if (form.name.trim().length < 2) {
      toast.error("Nombre requerido (mínimo 2 caracteres)")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/user/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data?.data?.client) {
        setClients((prev) => [data.data.client, ...prev])
        setForm({ name: "", email: "", phone: "", notes: "" })
        setShowForm(false)
        toast.success("Cliente creado")
      } else {
        toast.error(data.error?.message || "Error al crear cliente")
      }
    } catch {
      toast.error("Error al crear cliente")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm("¿Eliminar este cliente?")) return
    try {
      const res = await fetch("/api/user/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (data?.data?.deleted) {
        setClients((prev) => prev.filter((c) => c.id !== clientId))
        toast.success("Cliente eliminado")
      } else {
        toast.error(data.error?.message || "Error al eliminar")
      }
    } catch {
      toast.error("Error al eliminar cliente")
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-pulse text-[#C2E09D]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <Badge variant="primary" className="mb-3 rounded-full px-4 py-1.5 border-0">
              <Users className="w-3.5 h-3.5 mr-2" />
              Esteticista
            </Badge>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6]">
              Panel de Clientes
            </h1>
            <p className="text-sm text-[#64705E] dark:text-[#9BAA93] mt-1">
              Gestiona tus pacientes y analiza su piel con IA.
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6 p-6">
            <CardContent className="p-0">
              <h3 className="font-medium text-[#2F3A2D] dark:text-[#E8EDE6] mb-4">Agregar Cliente</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#64705E] dark:text-[#9BAA93] mb-1 block">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2A3328] bg-white dark:bg-[#222920] text-[#2F3A2D] dark:text-[#E8EDE6] text-sm"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#64705E] dark:text-[#9BAA93] mb-1 block">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2A3328] bg-white dark:bg-[#222920] text-[#2F3A2D] dark:text-[#E8EDE6] text-sm"
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#64705E] dark:text-[#9BAA93] mb-1 block">Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2A3328] bg-white dark:bg-[#222920] text-[#2F3A2D] dark:text-[#E8EDE6] text-sm"
                    placeholder="+53 5555 5555"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#64705E] dark:text-[#9BAA93] mb-1 block">Notas</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#DDE7D3] dark:border-[#2A3328] bg-white dark:bg-[#222920] text-[#2F3A2D] dark:text-[#E8EDE6] text-sm"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={handleCreate} disabled={creating} variant="primary" size="sm" className="gap-2">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Guardar
                </Button>
                <Button onClick={() => setShowForm(false)} variant="secondary" size="sm">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="p-5">
            <CardContent className="p-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C2E09D]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#C2E09D]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2F3A2D] dark:text-[#E8EDE6]">{clients.length}</p>
                <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">Clientes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-5">
            <CardContent className="p-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C2E09D]/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#C2E09D]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2F3A2D] dark:text-[#E8EDE6]">50</p>
                <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">Clientes/mes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-5">
            <CardContent className="p-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C2E09D]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#C2E09D]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2F3A2D] dark:text-[#E8EDE6]">∞</p>
                <p className="text-xs text-[#64705E] dark:text-[#9BAA93]">Análisis</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {clients.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent className="p-0">
              <Users className="w-16 h-16 text-[#DDE7D3] dark:text-[#2A3328] mx-auto mb-4" />
              <h3 className="font-serif text-xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-2">
                Sin clientes aún
              </h3>
              <p className="text-sm text-[#64705E] dark:text-[#9BAA93] mb-6 max-w-sm mx-auto">
                Agrega tu primer cliente para comenzar a analizar su piel con IA.
              </p>
              <Button onClick={() => setShowForm(true)} variant="primary" className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar Primer Cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <Card key={client.id} className="p-5 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#C2E09D]/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#C2E09D]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2F3A2D] dark:text-[#E8EDE6]">{client.name}</p>
                        <div className="flex items-center gap-3 text-xs text-[#64705E] dark:text-[#9BAA93]">
                          {client.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {client.email}
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {client.phone}
                            </span>
                          )}
                        </div>
                        {client.notes && (
                          <p className="text-xs text-[#8A9A82] dark:text-[#7A8A72] mt-1">{client.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/analysis?client=${client.id}`}>
                        <Button variant="primary" size="sm" className="gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Analizar
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
