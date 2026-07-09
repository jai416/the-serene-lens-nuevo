"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ArrowRight, CreditCard, Loader2, AlertCircle } from "lucide-react"
import { getCsrfToken } from "@/lib/csrf-client"

export default function PricingSuccessPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const qvapayId = searchParams.get("payment_id") || searchParams.get("transaction_uuid")
  const paypalOrderId = searchParams.get("paypal_order_id") || searchParams.get("token")
  const plan = searchParams.get("plan")
  const [verifying, setVerifying] = useState(!!qvapayId || !!paypalOrderId)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (qvapayId) {
      const verify = async () => {
        try {
          const res = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
            body: JSON.stringify({ qvapayId }),
          })
          const data = await res.json()
          if (data?.data?.completed || data?.data?.alreadyCompleted) {
            setVerified(true)
          } else {
            setError("El pago aún está pendiente de confirmación. Si ya pagaste, espera unos minutos y recarga.")
          }
        } catch {
          setError("No se pudo verificar el pago. Intenta de nuevo.")
        } finally {
          setVerifying(false)
        }
      }
      verify()
    } else if (paypalOrderId && plan) {
      const capture = async () => {
        try {
          const res = await fetch("/api/payments/capture-paypal", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
            body: JSON.stringify({ orderId: paypalOrderId, plan }),
          })
          const data = await res.json()
          if (data?.data?.captured) {
            setVerified(true)
          } else {
            setError(data?.error || "No se pudo procesar el pago con PayPal")
          }
        } catch {
          setError("No se pudo procesar el pago con PayPal")
        } finally {
          setVerifying(false)
        }
      }
      capture()
    }
  }, [qvapayId, paypalOrderId, plan])

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <Card className="max-w-md w-full p-8 text-center">
          <CardContent className="p-0 space-y-6">
            <Loader2 className="w-12 h-12 text-[#88B078] mx-auto animate-spin" />
            <div>
              <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] dark:text-[#E8DED5] mb-2">
                Verificando tu pago...
              </h1>
              <p className="text-sm text-[#666666] dark:text-[#9BAA93]">
                Esto solo toma unos segundos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Card className="max-w-md w-full p-8 text-center">
        <CardContent className="p-0 space-y-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${error ? "bg-red-100 dark:bg-red-900/20" : "bg-[#88B078]/20"}`}>
            {error ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-[#88B078]" />
            )}
          </div>

          <div>
            <Badge variant={error ? "default" : "primary"} className={`mb-4 rounded-full px-4 py-1.5 border-0 ${error ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ""}`}>
              <CreditCard className="w-3.5 h-3.5 mr-2" />
              {error ? "Pago Pendiente" : "Pago Exitoso"}
            </Badge>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] dark:text-[#E8DED5] mb-2">
              {error ? "Pago recibido" : "¡Gracias por tu compra!"}
            </h1>
            <p className="text-sm text-[#666666] dark:text-[#9BAA93]">
              {error
                ? error
                : "Tu plan ha sido activado. Ya puedes disfrutar de todas las funciones."}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard">
              <Button variant="primary" className="w-full">
                Ir al Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            {!error && (
              <Link href="/analysis">
                <Button variant="secondary" className="w-full">
                  Comenzar un análisis
                </Button>
              </Link>
            )}
          </div>

          {session && (
            <p className="text-xs text-[#9BAA93] dark:text-[#7A8A72]">
              Sesión activa como {session.user.email}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
