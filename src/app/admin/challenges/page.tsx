"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, ArrowLeft, Plus, Trash2, Pencil, Users, Check, X } from "lucide-react"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

interface Challenge {
  id: string
  title: string
  description: string
  points: number
  frequency: string
  active: boolean
  createdAt: string
  _count?: { userChallenges: number }
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
}

export default function AdminChallengesPage() {
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", description: "", points: 10, frequency: "weekly", active: true })

  const loadChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/challenges")
      if (res.ok) {
        const d = await res.json()
        setChallenges(d?.data?.challenges || d.challenges || [])
      }
    } catch {
      toast.error("Error al cargar desafíos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") loadChallenges()
  }, [session, loadChallenges])

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><ListSkeleton rows={4} /></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const createChallenge = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("El título y la descripción son obligatorios")
      return
    }
    try {
      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          points: Number(form.points) || 10,
          frequency: form.frequency,
          active: form.active,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error?.message || "Error al crear el desafío")
      }
      toast.success("Desafío creado")
      setForm({ title: "", description: "", points: 10, frequency: "weekly", active: true })
      setCreating(false)
      loadChallenges()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear el desafío")
    }
  }

  const updateChallenge = async (id: string, data: Partial<Challenge>) => {
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al actualizar")
      toast.success("Desafío actualizado")
      setEditingId(null)
      loadChallenges()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar")
    }
  }

  const deleteChallenge = async (id: string) => {
    if (!confirm("¿Eliminar este desafío? Los participantes perderán su progreso.")) return
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Desafío eliminado")
      loadChallenges()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  return (
    <div className="overflow-x-hidden">
      <div className="mb-8">
        <Link href="/admin" className="text-sm text-[#666666] hover:text-[#1A1A1A] mb-4 inline-block">
          {t("common.back", locale)}
        </Link>
        <Badge className="bg-[#88B078]/20 text-[#88B078] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
          <Trophy className="w-3 h-3 mr-1.5" />
          Desafíos
        </Badge>
        <div className="flex items-center justify-between mt-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">Desafíos gamificados</h1>
          <Button variant={creating ? "secondary" : "primary"} onClick={() => setCreating(!creating)}>
            {creating ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {creating ? "Cancelar" : "Nuevo desafío"}
          </Button>
        </div>
        <p className="text-sm text-[#666666] mt-1">
          Los desafíos son visibles para los usuarios en /dashboard/challenges. {challenges.length} en total.
        </p>
      </div>

      {creating && (
        <Card className="mb-6 p-5">
          <CardContent className="p-0 space-y-4">
            <div>
              <label className="text-xs font-medium text-[#666666]">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Analiza tu piel 3 días seguidos"
                className="w-full mt-1 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#666666]">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Explica qué tiene que hacer el usuario"
                rows={3}
                className="w-full mt-1 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#666666]">Puntos</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                  className="w-full mt-1 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#666666]">Frecuencia</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#88B078]"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 accent-[#88B078]"
              />
              Activar inmediatamente
            </label>
            <Button variant="primary" onClick={createChallenge}>
              <Plus className="w-4 h-4 mr-2" />
              Crear desafío
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : challenges.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <Trophy className="w-8 h-8 text-[#E8E8E8] mx-auto mb-3" />
            <p className="text-sm text-[#666666]">Todavía no hay desafíos. Crea el primero.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {challenges.map((c) => (
            <Card key={c.id} className="p-5">
              <CardContent className="p-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#1A1A1A]">{c.title}</h3>
                      <Badge
                        className={`rounded-full px-2 py-0.5 text-[10px] border-0 ${
                          c.active ? "bg-[#E2ECE0] text-[#88B078]" : "bg-[#F5F5F5] text-[#999999]"
                        }`}
                      >
                        {c.active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge className="rounded-full px-2 py-0.5 text-[10px] border-0 bg-[#F8F9FA] text-[#666666]">
                        {FREQUENCY_LABELS[c.frequency] || c.frequency}
                      </Badge>
                      <Badge className="rounded-full px-2 py-0.5 text-[10px] border-0 bg-[#F8F9FA] text-[#666666]">
                        {c.points} pts
                      </Badge>
                    </div>
                    <p className="text-sm text-[#666666] mt-1.5">{c.description}</p>
                    <p className="text-[11px] text-[#999999] mt-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {c._count?.userChallenges ?? 0} participantes
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateChallenge(c.id, { active: !c.active })}
                      title={c.active ? "Desactivar" : "Activar"}
                    >
                      {c.active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingId(c.id)
                        setForm({
                          title: c.title,
                          description: c.description,
                          points: c.points,
                          frequency: c.frequency,
                          active: c.active,
                        })
                        setCreating(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => deleteChallenge(c.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {editingId === c.id && (
                  <div className="mt-4 pt-4 border-t border-[#E8E8E8] space-y-3">
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A]"
                    />
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A]"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={form.points}
                        onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                        className="w-24 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A]"
                      />
                      <select
                        value={form.frequency}
                        onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                        className="rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#1A1A1A]"
                      >
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                      </select>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          await updateChallenge(c.id, {
                            title: form.title,
                            description: form.description,
                            points: Number(form.points) || 10,
                            frequency: form.frequency,
                          })
                        }}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
