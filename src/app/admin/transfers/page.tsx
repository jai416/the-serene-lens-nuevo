"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { getCsrfToken } from "@/lib/csrf-client"
import { ListSkeleton } from "@/components/ui/skeleton"

interface Transfer {
  id: string
  referenceCode: string
  plan: string
  amount: number
  currency: string
  status: string
  createdAt: string
  validatedAt: string | null
  activatedAt: string | null
  userId: string
  validatedById: string | null
  activatedById: string | null
  user: { name: string | null; email: string }
  validator: { name: string } | null
  activator: { name: string } | null
}

const statusConfig: Record<string, { label: string; variant: "secondary" | "success" | "primary" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  validated: { label: "Validado", variant: "success" },
  activated: { label: "Activado", variant: "primary" },
}

export default function AdminTransfersPage() {
  const { data: session, status } = useSession()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)

  const userRole = session?.user?.role ?? ""
  const isAdmin = userRole === "ADMIN"
  const canValidate = isAdmin || userRole === "VALIDATOR"

  const getTransfers = useCallback(async (pg = 1) => {
    try {
      const res = await fetch(`/api/admin/transfers?page=${pg}&limit=50`)
      if (!res.ok) throw new Error("Error al cargar")
      const d = await res.json()
      const payload = d?.data || d
      setTransfers(payload?.transfers || payload || [])
    } catch {
      toast.error("Error al cargar transferencias")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session && !canValidate) return
    if (session && canValidate) getTransfers()
  }, [session, canValidate, getTransfers])

  const handleValidate = useCallback(async (referenceCode: string) => {
    try {
      const res = await fetch("/api/payments/validate-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ referenceCode }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || "Error al validar")
      toast.success("Pago validado correctamente")
      getTransfers()
    } catch (e: any) {
      toast.error(e.message || "Error al validar transferencia")
    }
  }, [getTransfers])

  const handleActivate = useCallback(async (referenceCode: string) => {
    try {
      const res = await fetch("/api/payments/activate-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ referenceCode }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || "Error al activar")
      toast.success("Acceso activado correctamente")
      getTransfers()
    } catch (e: any) {
      toast.error(e.message || "Error al activar acceso")
    }
  }, [getTransfers])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><ListSkeleton rows={5} /></div>
  if (!session || !canValidate) redirect("/")

  const showActions = (t: Transfer) => {
    if (t.status === "pending" && canValidate) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-[#88B078] text-[#1A1A1A] dark:text-[#E8EDE6] hover:bg-[#88B078]/20"
          onClick={() => handleValidate(t.referenceCode)}
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Validar Pago
        </Button>
      )
    }
    if (t.status === "validated" && isAdmin) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-[#88B078] text-[#1A1A1A] dark:text-[#E8EDE6] hover:bg-[#88B078]/20"
          onClick={() => handleActivate(t.referenceCode)}
        >
          <ShieldCheck className="w-3 h-3 mr-1" />
          Activar Acceso
        </Button>
      )
    }
    if (t.status === "activated") {
      return <span className="text-xs text-[#666666] dark:text-[#9BAA93]">Completado</span>
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#1A1F19] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-[#666666] dark:text-[#9BAA93] hover:text-[#1A1A1A] dark:hover:text-[#E8EDE6] inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="w-3 h-3" /> Volver al panel
          </Link>
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 mr-2" />
            Transferencias
          </Badge>
          <h1 className="font-serif text-3xl font-semibold mb-2">
            Gestión de <span className="gradient-text">Transferencias</span>
          </h1>
          <p className="text-sm text-[#666666] dark:text-[#9BAA93]">
            Valida y activa pagos por transferencia bancaria
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E8E8] dark:border-[#3A4536]/20">
                  <th className="text-left p-4 font-medium text-[#666666] dark:text-[#9BAA93]">Cliente</th>
                  <th className="text-left p-4 font-medium text-[#666666] dark:text-[#9BAA93]">Plan</th>
                  <th className="text-left p-4 font-medium text-[#666666] dark:text-[#9BAA93]">Monto</th>
                  <th className="text-left p-4 font-medium text-[#666666] dark:text-[#9BAA93]">Referencia</th>
                  <th className="text-left p-4 font-medium text-[#666666] dark:text-[#9BAA93]">Fecha</th>
                  <th className="text-left p-4 font-medium text-[#666666] dark:text-[#9BAA93]">Estado</th>
                  <th className="text-left p-4 font-medium text-[#666666] dark:text-[#9BAA93]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#666666] dark:text-[#9BAA93]">Cargando transferencias...</td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#666666] dark:text-[#9BAA93]">No hay transferencias registradas</td>
                  </tr>
                ) : (
                  transfers.map((t) => {
                    const cfg = statusConfig[t.status] || { label: t.status, variant: "secondary" as const }
                    return (
                      <tr key={t.id} className="border-b border-[#E8E8E8] dark:border-[#3A4536]/10 hover:bg-[#E2ECE0] dark:hover:bg-[#2A3228] transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{t.user.name || "—"}</p>
                          <p className="text-xs text-[#666666] dark:text-[#9BAA93]">{t.user.email}</p>
                        </td>
                        <td className="p-4">{t.plan}</td>
                        <td className="p-4 font-medium">${t.amount.toFixed(2)}</td>
                        <td className="p-4 text-xs text-[#666666] dark:text-[#9BAA93] font-mono">{t.referenceCode}</td>
                        <td className="p-4 text-xs text-[#666666] dark:text-[#9BAA93]">{formatDate(t.createdAt)}</td>
                        <td className="p-4">
                          <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
                        </td>
                        <td className="p-4">{showActions(t)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
