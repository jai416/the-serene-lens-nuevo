"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Save, AlertCircle } from "lucide-react"

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const [name, setName] = useState(session?.user?.name || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!session) redirect("/api/auth/signin")

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

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Badge variant="neon" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <User className="w-3.5 h-3.5 mr-2" />
            Perfil
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
            Mi <span className="gradient-text">Perfil</span>
          </h1>
        </div>

        <Card className="p-6 border-[rgba(255,255,255,0.25)]">
          <CardContent className="p-0 space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                value={session.user.email || ""}
                disabled
                className="w-full rounded-xl border border-input bg-muted px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">Perfil actualizado</p>
            )}

            <Button onClick={handleSave} disabled={saving} className="rounded-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
