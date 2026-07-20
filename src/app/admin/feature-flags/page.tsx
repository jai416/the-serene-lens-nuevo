"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, ArrowLeft, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

interface FlagConfig {
  enabled: boolean
  message?: string
  redirectUrl?: string
}

export default function AdminFeatureFlagsPage() {
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [flags, setFlags] = useState<Record<string, FlagConfig>>({})
  const [loading, setLoading] = useState(true)
  const [newFlag, setNewFlag] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [newRedirect, setNewRedirect] = useState("")
  const [editingFlag, setEditingFlag] = useState<string | null>(null)
  const [editMessage, setEditMessage] = useState("")
  const [editRedirect, setEditRedirect] = useState("")

  const loadFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feature-flags")
      if (res.ok) {
        const d = await res.json()
        const raw = d?.data?.flags || d.flags || {}
        const parsed: Record<string, FlagConfig> = {}
        for (const [key, val] of Object.entries(raw)) {
          if (typeof val === "boolean") parsed[key] = { enabled: val }
          else if (typeof val === "object" && val !== null) parsed[key] = val as FlagConfig
          else parsed[key] = { enabled: val === "true" }
        }
        setFlags(parsed)
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

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><ListSkeleton rows={4} /></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const toggleFlag = async (flag: string, config: FlagConfig) => {
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag, ...config }),
      })
      if (res.ok) {
        setFlags({ ...flags, [flag]: config })
        toast.success(`Flag ${flag} ${config.enabled ? "activado" : "desactivado"}`)
      }
    } catch {
      toast.error("Error al actualizar flag")
    }
  }

  const addFlag = async () => {
    if (!newFlag.trim()) return
    const flag = newFlag.trim().toLowerCase().replace(/\s+/g, "-")
    const config: FlagConfig = { enabled: false, message: newMessage || undefined, redirectUrl: newRedirect || undefined }
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag, ...config }),
      })
      if (res.ok) {
        setFlags({ ...flags, [flag]: config })
        setNewFlag("")
        setNewMessage("")
        setNewRedirect("")
        toast.success(`Flag "${flag}" creado`)
      }
    } catch {
      toast.error("Error al crear flag")
    }
  }

  const startEdit = (flag: string, config: FlagConfig) => {
    setEditingFlag(flag)
    setEditMessage(config.message || "")
    setEditRedirect(config.redirectUrl || "")
  }

  const saveEdit = async (flag: string) => {
    const config = flags[flag]
    const updated: FlagConfig = { ...config, message: editMessage || undefined, redirectUrl: editRedirect || undefined }
    await toggleFlag(flag, updated)
    setEditingFlag(null)
  }

  return (
    <div className="overflow-x-hidden">
      <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#666666] hover:text-[#1A1A1A]">{t("common.back", locale)}</Link>
          <Badge className="bg-[#88B078]/20 text-[#88B078] border-0 rounded-full px-3 py-1 text-[10px] font-medium">
            <Settings className="w-3 h-3 mr-1.5" />
            Feature Flags
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-3">
            Gestionar <span style={{ color: "#88B078" }}>Funciones</span>
          </h1>
          <p className="text-sm text-[#666666] mt-1">Activa/desactiva funciones, configura mensajes y redirecciones</p>
      </div>

      {/* Add new flag */}
          <Card className="mb-6" style={{ backgroundColor: "white", borderColor: "#E8E8E8" }}>
        <CardContent className="p-4">
          <div className="flex gap-3 mb-3">
            <input
              value={newFlag}
              onChange={(e) => setNewFlag(e.target.value)}
              placeholder="Nombre (ej: product-analyzer)"
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8", color: "#1A1A1A" }}
              onKeyDown={(e) => e.key === "Enter" && addFlag()}
            />
            <Button onClick={addFlag} style={{ backgroundColor: "#88B078", color: "#fff" }}>
              <Plus className="w-4 h-4 mr-2" />
              Crear
            </Button>
          </div>
          <div className="flex gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mensaje personalizado (opcional)"
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8", color: "#1A1A1A" }}
            />
            <input
              value={newRedirect}
              onChange={(e) => setNewRedirect(e.target.value)}
              placeholder="URL de redirección (opcional, ej: /products)"
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8", color: "#1A1A1A" }}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : Object.keys(flags).length === 0 ? (
        <Card style={{ backgroundColor: "white", borderColor: "#E8E8E8" }}>
          <CardContent className="p-8 text-center" style={{ color: "#666666" }}>
            No hay feature flags configurados
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {Object.entries(flags).sort(([a], [b]) => a.localeCompare(b)).map(([flag, config]) => (
        <Card key={flag} style={{ backgroundColor: "white", borderColor: "#E8E8E8" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <code className="text-sm font-mono" style={{ color: "#1A1A1A" }}>{flag}</code>
                    {config.message && <p className="text-xs mt-1" style={{ color: "#666666" }}>📝 {config.message}</p>}
                    {config.redirectUrl && <p className="text-xs" style={{ color: "#666666" }}>↪ {config.redirectUrl}</p>}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => toggleFlag(flag, { ...config, enabled: !config.enabled })}
                    style={{
                      backgroundColor: config.enabled ? "#88B078" : "#E8E8E8",
                      color: config.enabled ? "#1A1A1A" : "#666666",
                      border: "none",
                    }}
                  >
                    {config.enabled ? "ON" : "OFF"}
                  </Button>
                </div>

                {editingFlag === flag ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      placeholder="Mensaje"
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs"
                    style={{ backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8", color: "#1A1A1A" }}
                    />
                    <input
                      value={editRedirect}
                      onChange={(e) => setEditRedirect(e.target.value)}
                      placeholder="URL redirección"
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs"
                      style={{ backgroundColor: "#F8F9FA", border: "1px solid #E8E8E8", color: "#1A1A1A" }}
                    />
                    <Button size="sm" onClick={() => saveEdit(flag)} style={{ backgroundColor: "#88B078", color: "#fff" }}>
                      Guardar
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(flag, config)}
                    className="text-xs mt-1 opacity-50 hover:opacity-100"
                    style={{ color: "#666666" }}
                  >
                    ✏️ Editar mensaje y redirección
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
