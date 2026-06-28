"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, ArrowLeft, Plus } from "lucide-react"
import { toast } from "sonner"

export default function AdminFeatureFlagsPage() {
  const { data: session, status } = useSession()
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [newFlag, setNewFlag] = useState("")

  const loadFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feature-flags")
      if (res.ok) {
        const d = await res.json()
        setFlags(d?.data?.flags || d.flags || {})
      }
    } catch {
      toast.error("Error al cargar feature flags")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") loadFlags()
  }, [session, loadFlags])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-[#64705E] dark:text-[#9BAA93]">Cargando...</p></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const toggleFlag = async (flag: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag, enabled }),
      })
      if (res.ok) {
        setFlags({ ...flags, [flag]: enabled })
        toast.success(`Flag ${flag} ${enabled ? "activado" : "desactivado"}`)
      }
    } catch {
      toast.error("Error al actualizar flag")
    }
  }

  const addFlag = async () => {
    if (!newFlag.trim()) return
    const flag = newFlag.trim().toLowerCase().replace(/\s+/g, "-")
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag, enabled: false }),
      })
      if (res.ok) {
        setFlags({ ...flags, [flag]: false })
        setNewFlag("")
        toast.success(`Flag "${flag}" creado`)
      }
    } catch {
      toast.error("Error al crear flag")
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF5] dark:bg-[#1A1F19] pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#64705E] dark:text-[#9BAA93] hover:text-[#2F3A2D] dark:hover:text-[#E8EDE6] inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="w-3 h-3" /> Volver al panel
          </Link>
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <Settings className="w-3.5 h-3.5 mr-2" />
            Feature Flags
          </Badge>
          <h1 className="font-serif text-3xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6]">
            Gestionar <span className="gradient-text">Feature Flags</span>
          </h1>
          <p className="text-sm text-[#64705E] dark:text-[#9BAA93] mt-1">Activa o desactiva funciones de la plataforma</p>
        </div>

        {/* Add new flag */}
        <Card className="mb-6">
          <CardContent className="p-4 flex gap-3">
            <input
              value={newFlag}
              onChange={(e) => setNewFlag(e.target.value)}
              placeholder="Nombre del flag (ej: new-feature)"
              className="flex-1 px-4 py-2 border border-[#DDE7D3] dark:border-[#3A4536] rounded-lg bg-background text-[#2F3A2D] dark:text-[#E8EDE6]"
              onKeyDown={(e) => e.key === "Enter" && addFlag()}
            />
            <Button onClick={addFlag} className="bg-[#C2E09D] text-[#2F3A2D]">
              <Plus className="w-4 h-4 mr-2" />
              Crear
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-[#64705E] dark:text-[#9BAA93] text-center py-8">Cargando...</p>
        ) : Object.keys(flags).length === 0 ? (
          <Card><CardContent className="p-8 text-center text-[#64705E] dark:text-[#9BAA93]">No hay feature flags configurados</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {Object.entries(flags).sort(([a], [b]) => a.localeCompare(b)).map(([flag, enabled]) => (
              <Card key={flag} className="hover:bg-[#F0F5EC] dark:bg-[#2A3228]/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <code className="text-sm font-mono text-[#2F3A2D] dark:text-[#C2E09D]">{flag}</code>
                  </div>
                  <Button
                    variant={enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFlag(flag, !enabled)}
                    className={enabled ? "bg-[#C2E09D] text-[#2F3A2D] hover:bg-[#B0D48E]" : ""}
                  >
                    {enabled ? "ON" : "OFF"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
