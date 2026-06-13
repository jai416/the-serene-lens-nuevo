"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react"
import { formatDate, formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface Payment {
  id: string
  provider: string
  qvapayId: string | null
  stripePaymentId: string | null
  plan: string
  amount: number
  currency: string
  status: string
  createdAt: string
  confirmedAt: string | null
  user: { name: string | null; email: string }
}

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/admin/payments")
        .then((r) => r.ok ? r.json() : { payments: [] })
        .then((d) => setPayments(d.payments || []))
        .catch(() => toast.error("Error al cargar pagos"))
    }
  }, [session])

  if (status === "loading") return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>
  if (!session || session.user.role !== "ADMIN") redirect("/")

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="w-3 h-3" /> Volver al panel
          </Link>
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <CreditCard className="w-3.5 h-3.5 mr-2" />
            Pagos
          </Badge>
          <h1 className="font-serif text-3xl font-semibold mb-2">
            Gestión de <span className="gradient-text">Pagos</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Total ingresos: <span className="font-semibold text-on-surface">${totalRevenue.toFixed(2)}</span>
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline/20">
                  <th className="text-left p-4 font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Proveedor</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Monto</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">ID Transacción</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-outline/10 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{p.user.name || "—"}</td>
                    <td className="p-4 text-muted-foreground">{p.user.email}</td>
                    <td className="p-4">{p.plan}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px]">
                        {p.provider === "stripe" ? "Stripe" : "QvaPay"}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium">{formatPrice(p.amount, p.currency)}</td>
                    <td className="p-4">
                      {p.status === "completed" ? (
                        <Badge variant="success" className="flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Pagado
                        </Badge>
                      ) : p.status === "pending" ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Pendiente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> {p.status}
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{formatDate(p.createdAt)}</td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">
                      {p.stripePaymentId ? p.stripePaymentId.slice(0, 12) + "..." : p.qvapayId ? p.qvapayId.slice(0, 12) + "..." : "—"}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">No hay pagos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
