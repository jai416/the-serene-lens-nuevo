"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CheckCircle2, XCircle, Clock, ShoppingBag, Repeat, BarChart3, AlertCircle, Loader2, DollarSign, WalletCards } from "lucide-react"
import { getPlanLabel, formatPrice, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getCsrfToken } from "@/lib/csrf-client"
import { CardSkeleton } from "@/components/ui/skeleton"

interface Payment {
  id: string
  plan: string
  amount: number
  currency: string
  status: string
  provider: string
  createdAt: string
  confirmedAt: string | null
}

interface Usage {
  plan: string
  isUnlimited: boolean
  monthlyLimit: number
  monthlyUsed: number
  monthlyRemaining: number
  packTotal: number
  packRemaining: number
  totalRemaining: number | null
}

interface Pack {
  id: string
  packType: string
  analyses: number
  status: string
  createdAt: string
}

export default function SubscriptionPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [packs, setPacks] = useState<Pack[]>([])
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    setLoadingPayment(`qvapay-${planId}`)
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ plan: planId, provider: "qvapay" }),
      })
      const data = await res.json()
      const payload = data?.data || data
      if (payload?.url) window.location.href = payload.url
      else toast.error("No se recibió URL de pago")
    } catch {
      toast.error("Error al procesar pago")
    } finally {
      setLoadingPayment(null)
    }
  }

  const handlePayPal = async (planId: string) => {
    setLoadingPayment(`paypal-${planId}`)
    try {
      const res = await fetch("/api/payments/create-paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ plan: planId, amount: 0 }),
      })
      const data = await res.json()
      const payload = data?.data || data
      if (payload?.url || payload?.approvalUrl) window.location.href = payload.url || payload.approvalUrl
      else toast.error("No se recibió URL de pago")
    } catch {
      toast.error("Error al procesar pago con PayPal")
    } finally {
      setLoadingPayment(null)
    }
  }

  const handleTransfer = async (planId: string) => {
    setLoadingPayment(`transfer-${planId}`)
    try {
      const amount = planId === "PREMIUM" ? 4.99 : planId === "PRO" ? 9.99 : planId === "PRO_PLUS" ? 14.99 : 0
      const res = await fetch("/api/payments/create-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ plan: planId, amount }),
      })
      const data = await res.json()
      const payload = data?.data || data
      if (payload?.account) {
        toast.success("Datos de transferencia generados")
        router.push("/pricing")
      } else {
        toast.error(payload?.error || "Error al crear transferencia")
      }
    } catch {
      toast.error("Error al crear transferencia")
    } finally {
      setLoadingPayment(null)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    if (session) {
      fetch("/api/user/payments", { signal: controller.signal })
        .then((res) => res.ok ? res.json() : { payments: [] })
        .then((data) => setPayments(data?.data?.payments || data.payments || []))
        .catch(() => toast.error("Error al cargar pagos"))

      fetch("/api/user/usage", { signal: controller.signal })
        .then((res) => res.ok ? res.json() : { usage: null })
        .then((data) => setUsage(data?.data?.usage || data.usage))
        .catch(() => {})
    }
    return () => controller.abort()
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CardSkeleton />
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  const plan = session.user.plan || "FREE"
  const isPaid = plan !== "FREE"

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <CreditCard className="w-3.5 h-3.5 mr-2" />
            Mi Suscripción
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2F3A2D]">
            Mi Suscripción
          </h1>
        </div>

        {/* Current Plan */}
        <Card className={`p-6 mb-6 ${isPaid ? "ring-1 ring-[#C2E09D]" : ""}`}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#64705E]">Plan actual</p>
                <h2 className="font-serif text-2xl font-semibold text-[#2F3A2D]">{getPlanLabel(plan)}</h2>
              </div>
              <Badge className={isPaid ? "bg-[#C2E09D] text-[#2F3A2D]" : "bg-[#F0F5EC] text-[#64705E]"}>
                {isPaid ? "Activo" : "Gratuito"}
              </Badge>
            </div>

            {plan === "PRO_PLUS" && (
              <div className="mt-4 p-4 rounded-xl bg-[#C2E09D]/10 border border-[#C2E09D]">
                <p className="text-sm font-medium text-[#2F3A2D] mb-2">Funciones Pro+ exclusivas:</p>
                <ul className="space-y-1 text-xs text-[#64705E]">
                  <li>• Comparativa mensual automática</li>
                  <li>• Rutina dinámica semanal</li>
                  <li>• Informe PDF descargable</li>
                  <li>• Soporte prioritario (1 hora)</li>
                </ul>
              </div>
            )}
            {!isPaid && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-[#2F3A2D]">Actualizar a Premium — $4.99/mes</p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleSubscribe("PREMIUM")}
                    disabled={!!loadingPayment}
                    variant="primary"
                    className="w-full py-3"
                  >
                    {loadingPayment === "qvapay-PREMIUM" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <WalletCards className="w-4 h-4 mr-2" />
                    )}
                    {loadingPayment === "qvapay-PREMIUM" ? "Procesando..." : "Pagar con QvaPay"}
                  </Button>
                  <Button
                    onClick={() => handlePayPal("PREMIUM")}
                    disabled={!!loadingPayment}
                    variant="secondary"
                    className="w-full py-3"
                  >
                    {loadingPayment === "paypal-PREMIUM" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <DollarSign className="w-4 h-4 mr-2" />
                    )}
                    {loadingPayment === "paypal-PREMIUM" ? "Procesando..." : "Pagar con PayPal"}
                  </Button>
                  <Button
                    onClick={() => handleTransfer("PREMIUM")}
                    disabled={!!loadingPayment}
                    variant="outline"
                    className="w-full py-3"
                  >
                    {loadingPayment === "transfer-PREMIUM" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    {loadingPayment === "transfer-PREMIUM" ? "Procesando..." : "Pagar con Transfermovil"}
                  </Button>
                </div>
                <Link href="/pricing" className="block text-center text-xs text-[#64705E] hover:text-[#2F3A2D] mt-2">
                  Ver todos los planes
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        {usage && (
          <Card className="p-6 mb-6">
            <CardContent className="p-0">
              <h3 className="font-medium text-sm mb-4 flex items-center gap-2 text-[#2F3A2D]">
                <BarChart3 className="w-4 h-4 text-[#2F3A2D]" />
                Análisis disponibles
              </h3>
              <div className="space-y-3">
                {!usage.isUnlimited && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#64705E]">Plan {getPlanLabel(usage.plan)}</span>
                      <span className="font-medium text-[#2F3A2D]">{usage.monthlyUsed} / {usage.monthlyLimit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0F5EC] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C2E09D] transition-all"
                        style={{ width: `${Math.min(100, (usage.monthlyUsed / usage.monthlyLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {usage.packTotal > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#64705E]">Paquetes</span>
                      <span className="font-medium text-[#2F3A2D]">{usage.packTotal - usage.packRemaining} / {usage.packTotal}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0F5EC] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FFF6AD] transition-all"
                        style={{ width: `${Math.min(100, ((usage.packTotal - usage.packRemaining) / usage.packTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {usage.isUnlimited ? (
                  <p className="text-sm text-[#2F3A2D] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Análisis ilimitados
                  </p>
                ) : (
                  <p className="text-sm text-[#64705E]">
                    {usage.totalRemaining === Infinity
                      ? "Análisis ilimitados"
                      : `${usage.totalRemaining} análisis restantes`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Packs purchased */}
        {isPaid && (
          <Link href="/pricing?tab=packs">
            <Card className="transition-all duration-200 cursor-pointer hover:ring-1 hover:ring-[#C2E09D]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-[#2F3A2D]" />
                  <div>
                    <p className="text-sm font-medium text-[#2F3A2D]">Comprar más análisis</p>
                    <p className="text-xs text-[#64705E]">Paquetes adicionales</p>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-[#9BAA93]" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div>
            <h2 className="font-serif text-xl font-semibold mb-4 text-[#2F3A2D]">Historial de Pagos</h2>
            <div className="space-y-2">
              {payments.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {p.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-[#2F3A2D]" />
                      ) : p.status === "pending" ? (
                        <Clock className="w-5 h-5 text-[#64705E]" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[#E07070]" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#2F3A2D]">
                          {getPlanLabel(p.plan)} - {formatPrice(p.amount, p.currency)}
                        </p>
                        <p className="text-xs text-[#64705E]">
                          {formatDate(p.createdAt)} · QvaPay
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={p.status === "completed" ? "success" : p.status === "pending" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {p.status === "completed" ? "Pagado" : p.status === "pending" ? "Pendiente" : p.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {payments.length === 0 && !isPaid && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F0F5EC] flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-[#64705E]" />
              </div>
              <p className="text-[#64705E] mb-4">No tienes pagos registrados aún.</p>
              <Link href="/pricing">
                <Button variant="primary">
                  Ver planes y precios
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
