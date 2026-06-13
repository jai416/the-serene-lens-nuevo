"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CheckCircle2, XCircle, Clock, ShoppingBag, Repeat, BarChart3, AlertCircle, Loader2 } from "lucide-react"
import { getPlanLabel, formatPrice, formatDate } from "@/lib/utils"
import { toast } from "sonner"

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
  const { data: session, status, update } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [packs, setPacks] = useState<Pack[]>([])

  useEffect(() => {
    if (session) {
      fetch("/api/user/payments")
        .then((res) => res.ok ? res.json() : { payments: [] })
        .then((data) => setPayments(data.payments || []))
        .catch(() => toast.error("Error al cargar pagos"))

      fetch("/api/user/usage")
        .then((res) => res.ok ? res.json() : { usage: null })
        .then((data) => setUsage(data.usage))
        .catch(() => {})
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!session) redirect("/api/auth/signin")

  const plan = session.user.plan || "FREE"
  const isPaid = plan !== "FREE"

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Badge variant="neon" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <CreditCard className="w-3.5 h-3.5 mr-2" />
            Mi Suscripción
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
            Mi <span className="gradient-text">Suscripción</span>
          </h1>
        </div>

        {/* Current Plan */}
        <Card className={`p-6 border-[rgba(255,255,255,0.25)] mb-6 ${isPaid ? "ring-1 ring-primary/20" : ""}`}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan actual</p>
                <h2 className="font-serif text-2xl font-semibold">{getPlanLabel(plan)}</h2>
              </div>
              <Badge className={isPaid ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                {isPaid ? "Activo" : "Gratuito"}
              </Badge>
            </div>

            {!isPaid && (
              <Link href="/pricing">
                <Button className="rounded-full gradient-primary text-white w-full mt-4">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Actualizar plan
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        {usage && (
          <Card className="p-6 border-[rgba(255,255,255,0.25)] mb-6">
            <CardContent className="p-0">
              <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Análisis disponibles
              </h3>
              <div className="space-y-3">
                {!usage.isUnlimited && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Plan {getPlanLabel(usage.plan)}</span>
                      <span className="font-medium">{usage.monthlyUsed} / {usage.monthlyLimit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-primary transition-all"
                        style={{ width: `${Math.min(100, (usage.monthlyUsed / usage.monthlyLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {usage.packTotal > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Paquetes</span>
                      <span className="font-medium">{usage.packTotal - usage.packRemaining} / {usage.packTotal}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${Math.min(100, ((usage.packTotal - usage.packRemaining) / usage.packTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {usage.isUnlimited ? (
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Análisis ilimitados
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
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
            <Card className="border-[rgba(255,255,255,0.25)] transition-all duration-200 cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Comprar más análisis</p>
                    <p className="text-xs text-muted-foreground">Paquetes adicionales sin caducidad</p>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div>
            <h2 className="font-serif text-xl font-semibold mb-4">Historial de Pagos</h2>
            <div className="space-y-2">
              {payments.map((p) => (
                <Card key={p.id} className="border-[rgba(255,255,255,0.25)]">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {p.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : p.status === "pending" ? (
                        <Clock className="w-5 h-5 text-amber-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {getPlanLabel(p.plan)} - {formatPrice(p.amount, p.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(p.createdAt)} · {p.provider === "stripe" ? "Stripe" : "QvaPay"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        p.status === "completed" ? "success" : p.status === "pending" ? "secondary" : "outline"
                      }
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
          <Card className="border-[rgba(255,255,255,0.25)]">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No tienes pagos registrados aún.</p>
              <Link href="/pricing">
                <Button className="rounded-full gradient-primary text-white">
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
