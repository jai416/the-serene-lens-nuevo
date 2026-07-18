"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle2, CreditCard, Lock, Zap,
  DollarSign, Coins, WalletCards, Loader2, AlertCircle,
  ShoppingBag, Repeat,
} from "lucide-react"
import { PLANS, PACKS, CUP_RATE } from "@/lib/pricing"
import { toast } from "sonner"
import { getCsrfToken } from "@/lib/csrf-client"

type Tab = "subscriptions" | "packs"

interface TransferData {
  referenceCode: string
  reference?: string
  account?: string
  accountNumber?: string
  holder?: string
  amount: number
}

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("subscriptions")
  const [loading, setLoading] = useState<string | null>(null)
  const [loadingElapsed, setLoadingElapsed] = useState(0)
  const [error, setError] = useState("")
  const [selectedTransfer, setSelectedTransfer] = useState<TransferData | null>(null)
  const [giftModal, setGiftModal] = useState<{ packId: string; email: string; sending: boolean } | null>(null)
  const loadingStartRef = useRef(0)

  useEffect(() => {
    if (!loading) {
      setLoadingElapsed(0)
      return
    }
    loadingStartRef.current = Date.now()
    const interval = setInterval(() => {
      setLoadingElapsed(Date.now() - loadingStartRef.current)
    }, 1000)
    return () => clearInterval(interval)
  }, [loading])

  function getPaymentLoadingText(): string {
    if (loadingElapsed < 8000) return "Conectando con la pasarela de pago..."
    if (loadingElapsed < 20000) return "Conectando de forma segura con la pasarela... (esto puede tomar hasta 20 segundos)"
    return "Aún conectando... por favor no recargues ni cierres esta página"
  }

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/pricing")
      return
    }

    setLoading(`${planId}-qvapay`)
    setError("")

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ plan: planId, provider: "qvapay" }),
      })

      const data = await res.json()
      const payload = data?.data || data

      if (!res.ok) {
        throw new Error(data.error?.message || payload?.error || "Error al crear pago")
      }

      if (payload?.url) {
        window.location.href = payload.url
      } else {
        throw new Error("No se recibió URL de pago")
      }
    } catch (e: any) {
      const msg = e.message || "Error al procesar pago"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(null)
    }
  }

  const handleBuyPack = async (packId: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/pricing")
      return
    }

    setLoading(`${packId}-qvapay`)
    setError("")

    try {
      const res = await fetch("/api/payments/create-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ packType: packId, provider: "qvapay" }),
      })

      const data = await res.json()
      const payload = data?.data || data

      if (!res.ok) {
        throw new Error(data.error?.message || payload?.error || "Error al crear pago")
      }

      if (payload?.url) {
        window.location.href = payload.url
      } else {
        throw new Error("No se recibió URL de pago")
      }
    } catch (e: any) {
      const msg = e.message || "Error al procesar pago"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(null)
    }
  }

  const handleTransfer = async (id: string, amount: number) => {
    if (!session) {
      router.push("/login?callbackUrl=/pricing")
      return
    }

    setLoading(`${id}-transfer`)
    setError("")

    try {
      const res = await fetch("/api/payments/create-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ plan: id, amount }),
      })

      const data = await res.json()
      const payload = data?.data || data

      if (!res.ok) {
        throw new Error(data.error?.message || payload?.error || "Error al crear transferencia")
      }

      setSelectedTransfer(payload)
    } catch (e: any) {
      const msg = e.message || "Error al crear transferencia"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(null)
    }
  }

  const isLoadingPlan = (id: string) =>
    loading === `${id}-qvapay` || loading === `${id}-transfer`

  const handleGiftPack = (packId: string) => {
    if (!session) { router.push("/login?callbackUrl=/pricing"); return }
    setGiftModal({ packId, email: "", sending: false })
  }

  const submitGift = async () => {
    if (!giftModal?.email || !giftModal.packId) return
    setGiftModal({ ...giftModal, sending: true })
    setError("")
    try {
      const res = await fetch("/api/payments/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ packType: giftModal.packId, recipientEmail: giftModal.email }),
      })
      const data = await res.json()
      const payload = data?.data || data
      if (!res.ok) throw new Error(payload?.error || "Error al enviar regalo")
      toast.success("Regalo enviado correctamente. Revisa tu correo.")
      setGiftModal(null)
    } catch (e: any) {
      const msg = e.message || "Error al enviar regalo"
      setError(msg)
      toast.error(msg)
    } finally {
      if (giftModal) setGiftModal({ ...giftModal, sending: false })
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#F8F9FA]">
      {/* Transfer Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelectedTransfer(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedTransfer(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#E8E8E8] transition-colors text-[#666666]"
              aria-label="Cerrar"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">
              Transferencia por Transfermovil
            </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[#E8E8E8]">
                  <span className="text-[#666666]">Codigo de referencia</span>
                  <span className="font-mono font-medium text-[#1A1A1A]">{selectedTransfer.referenceCode || selectedTransfer.reference}</span>
                </div>
                {(selectedTransfer.account || selectedTransfer.accountNumber) && (
                  <div className="flex justify-between py-2 border-b border-[#E8E8E8]">
                    <span className="text-[#666666]">Numero de cuenta</span>
                    <span className="font-medium text-[#1A1A1A]">{selectedTransfer.account || selectedTransfer.accountNumber}</span>
                  </div>
                )}
                {selectedTransfer.holder && (
                  <div className="flex justify-between py-2 border-b border-[#E8E8E8]">
                    <span className="text-[#666666]">Titular</span>
                    <span className="font-medium text-[#1A1A1A]">{selectedTransfer.holder}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-[#E8E8E8]">
                  <span className="text-[#666666]">Monto a enviar</span>
                  <span className="font-medium text-[#1A1A1A]">${selectedTransfer.amount?.toFixed(2)}</span>
                </div>
              </div>
            <p className="text-xs text-[#9BAA93] mt-4 text-center">
              Realiza la transferencia y tu plan se activara manualmente.
            </p>
            <Button
              onClick={() => setSelectedTransfer(null)}
              variant="primary"
              className="w-full mt-4 py-3"
            >
              Entendido
            </Button>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      {giftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setGiftModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setGiftModal(null)} className="absolute top-3 right-3 text-[#666666] hover:text-[#1A1A1A] text-xl leading-none cursor-pointer">&times;</button>
            <h3 className="font-semibold text-lg text-[#1A1A1A] mb-3">Regalar analisis</h3>
            <p className="text-xs text-[#666666] mb-4">Ingresa el email de la persona que recibira este pack de analisis.</p>
            <input
              type="email"
              value={giftModal.email}
              onChange={(e) => setGiftModal({ ...giftModal, email: e.target.value })}
              placeholder="email@ejemplo.com"
              className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-[#88B078] text-[#1A1A1A]"
            />
            <Button onClick={submitGift} disabled={giftModal.sending || !giftModal.email} variant="primary" className="w-full">
              {giftModal.sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {giftModal.sending ? "Enviando..." : "Enviar regalo"}
            </Button>
          </div>
        </div>
      )}

      {/* Trial banner */}
      {session?.user?.trialEndsAt && (
        <div className="max-w-6xl mx-auto mb-8 p-4 rounded-2xl bg-gradient-to-r from-[#FFF9E6] to-[#FFF3CC] border border-[#FCEAA6]">
          <p className="text-sm text-[#1A1A1A] font-medium text-center">
            Estas disfrutando de tu prueba PREMIUM de 7 dias. 
            Tu plan volvera a Essential el {new Date(session.user.trialEndsAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}.
            {new Date(session.user.trialEndsAt) < new Date() ? " Tu prueba ya expiro. Suscribete para seguir disfrutando." : ""}
          </p>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <CreditCard className="w-3.5 h-3.5 mr-2" />
            Precios
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-[#1A1A1A]">
            Un Plan para Cada Objetivo
          </h1>
          <p className="text-[#666666] max-w-lg mx-auto">
            Desde analisis individuales hasta suscripciones ilimitadas. Tu eliges.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#666666]">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-[#88B078]" /> Pago seguro</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#88B078]" /> Sin compromiso</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full bg-[#E2ECE0] p-1">
            <button
              onClick={() => setTab("subscriptions")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                tab === "subscriptions" ? "bg-white shadow-sm text-[#1A1A1A]" : "text-[#666666] hover:text-[#1A1A1A]"
              }`}
            >
              <Repeat className="w-4 h-4" />
              Suscripciones
            </button>
            <button
              onClick={() => setTab("packs")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                tab === "packs" ? "bg-white shadow-sm text-[#1A1A1A]" : "text-[#666666] hover:text-[#1A1A1A]"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Paquetes
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-center flex items-center justify-center gap-2 text-[#E07070]">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Subscriptions */}
        {tab === "subscriptions" && (
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`p-6 sm:p-8 transition-all duration-300 flex flex-col ${
                  plan.popular ? "sm:scale-[1.04] z-10 ring-2 ring-[#88B078]" : ""
                }`}
                aria-label={`Plan: ${plan.name}`}
              >
                {plan.popular && (
                  <div className="mb-4">
                    <Badge variant="mint" className="rounded-full px-4 py-1 text-xs font-bold">
                      Mas Popular
                    </Badge>
                  </div>
                )}
                {plan.id === "ESTHETICIAN" && (
                  <div className="mb-4">
                    <Badge variant="primary" className="rounded-full px-4 py-1 text-xs font-bold">
                      Para Clinicas
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <p className="text-lg font-semibold mb-1 text-[#1A1A1A]">{plan.name}</p>
                  {plan.annual && (
                    <div className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#88B078] text-white mb-2">
                      AHORRA 16%
                    </div>
                  )}
                  {plan.priceUSD > 0 ? (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`font-bold text-[#1A1A1A] ${plan.popular ? "text-3xl" : "text-2xl"}`}>
                          ${plan.priceUSD.toFixed(2)}
                        </span>
                        <span className="text-sm text-[#666666]">/{plan.period.replace("por ", "")}</span>
                      </div>
                      {plan.monthlyPrice && (
                        <p className="text-xs text-[#666666] mt-0.5">
                          ${plan.monthlyPrice.toFixed(2)}/mes al pagar anual
                        </p>
                      )}
                      <p className="text-xs text-[#9BAA93] mt-1">
                        ≈ {plan.priceCUP.toLocaleString("es-CU")} CUP
                      </p>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-bold text-[#1A1A1A]">Gratis</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#666666]">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? "text-[#88B078]" : ""}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.priceUSD > 0 ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoadingPlan(plan.id)}
                      variant={plan.popular ? "primary" : "secondary"}
                      className="w-full py-4"
                      aria-label={`${plan.name} - QvaPay`}
                    >
                      {loading === `${plan.id}-qvapay` ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <WalletCards className="w-4 h-4 mr-2" />
                      )}
                      {loading === `${plan.id}-qvapay` ? getPaymentLoadingText() : "Pagar con QvaPay"}
                    </Button>
                    <Button
                      onClick={() => handleTransfer(plan.id, plan.priceUSD)}
                      disabled={isLoadingPlan(plan.id)}
                      variant="outline"
                      className="w-full py-4"
                      aria-label={`${plan.name} - Transfermovil`}
                    >
                      {loading === `${plan.id}-transfer` ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      {loading === `${plan.id}-transfer` ? getPaymentLoadingText() : "Pagar con Transfermovil"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => router.push("/analysis")}
                    variant="secondary"
                    className="w-full py-5"
                    aria-label="Essential - Comenzar Gratis"
                  >
                    Comenzar Gratis
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Packs */}
        {tab === "packs" && (
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PACKS.map((pack) => (
              <Card
                key={pack.id}
                className={`p-6 sm:p-8 transition-all duration-300 flex flex-col ${
                  pack.popular ? "sm:scale-[1.04] z-10 ring-2 ring-[#88B078]" : ""
                }`}
                aria-label={`Paquete: ${pack.name}`}
              >
                {pack.popular && (
                  <div className="mb-4">
                    <Badge variant="mint" className="rounded-full px-4 py-1 text-xs font-bold">
                      Mas Popular
                    </Badge>
                  </div>
                )}

                {!pack.popular && (
                  <div className="mb-4">
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                      {pack.analyses} analisis
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#88B078]/10 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-5 h-5 text-[#88B078]" />
                  </div>
                  <p className="text-lg font-semibold mb-1 text-[#1A1A1A]">{pack.name}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`font-bold text-[#1A1A1A] ${pack.popular ? "text-3xl" : "text-2xl"}`}>
                      ${pack.priceUSD.toFixed(2)}
                    </span>
                    <span className="text-sm text-[#666666]">USD</span>
                  </div>
                  <p className="text-xs text-[#9BAA93] mt-1">
                    ≈ {pack.priceCUP.toLocaleString("es-CU")} CUP
                  </p>
                  <p className="text-xs text-[#666666] mt-2">
                    <span className="text-[#1A1A1A] font-medium">{pack.analyses}</span> analisis · Valido por 30 dias
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {pack.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#666666]">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${pack.popular ? "text-[#88B078]" : ""}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={isLoadingPlan(pack.id)}
                    variant={pack.popular ? "primary" : "secondary"}
                    className="w-full py-4"
                    aria-label={`${pack.name} - QvaPay`}
                  >
                    {loading === `${pack.id}-qvapay` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <WalletCards className="w-4 h-4 mr-2" />
                    )}
                    {loading === `${pack.id}-qvapay` ? getPaymentLoadingText() : "Pagar con QvaPay"}
                  </Button>
                  <Button
                    onClick={() => handleTransfer(pack.id, pack.priceUSD)}
                    disabled={isLoadingPlan(pack.id)}
                    variant="outline"
                    className="w-full py-4"
                    aria-label={`${pack.name} - Transfermovil`}
                  >
                    {loading === `${pack.id}-transfer` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    {loading === `${pack.id}-transfer` ? getPaymentLoadingText() : "Pagar con Transfermovil"}
                    </Button>
                    <Button
                      onClick={() => handleGiftPack(pack.id)}
                      disabled={isLoadingPlan(pack.id)}
                      variant="outline"
                      className="w-full py-2.5 text-xs border-[#88B078] text-[#88B078] hover:bg-[#E2ECE0]"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      Regalar
                    </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Currencies badge */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
          <span className="text-xs text-[#666666] mr-2">Aceptamos:</span>
          <Badge variant="outline" className="rounded-full px-3 py-1.5 gap-1.5 text-xs">
            <DollarSign className="w-3 h-3 text-[#88B078]" />
            USD
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1.5 gap-1.5 text-xs">
            <Coins className="w-3 h-3 text-[#88B078]" />
            CUP
            <span className="text-[#9BAA93]">1 USD ≈ {CUP_RATE} CUP</span>
          </Badge>
        </div>

        <p className="text-xs text-[#9BAA93] text-center max-w-md mx-auto mt-6">
          Pagos procesados de forma segura a traves de QvaPay y Transfermovil.
          No almacenamos informacion de pago.
        </p>
      </div>
    </div>
  )
}
