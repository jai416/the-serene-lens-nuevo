"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
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

type Tab = "subscriptions" | "packs"

export default function PricingPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<Tab>("subscriptions")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleSubscribe = async (planId: string, provider: "stripe" | "qvapay") => {
    if (!session) {
      window.location.href = "/api/auth/signin"
      return
    }

    const key = `${planId}_${provider}`
    setLoading(key)
    setError("")

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, provider }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al crear pago")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      const msg = e.message || "Error al procesar pago"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(null)
    }
  }

  const handleBuyPack = async (packId: string, provider: "stripe" | "qvapay") => {
    if (!session) {
      window.location.href = "/api/auth/signin"
      return
    }

    const key = `${packId}_${provider}`
    setLoading(key)
    setError("")

    try {
      const res = await fetch("/api/payments/create-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packType: packId, provider }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al crear pago")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (e: any) {
      const msg = e.message || "Error al procesar pago"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <CreditCard className="w-3.5 h-3.5 mr-2" />
            Precios
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">
            Un Plan para Cada <span className="gradient-text">Objetivo</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Desde análisis individuales hasta suscripciones ilimitadas. Tú eliges.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-primary" /> Pago seguro</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> Sin compromiso</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full bg-muted p-1">
            <button
              onClick={() => setTab("subscriptions")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                tab === "subscriptions" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Repeat className="w-4 h-4" />
              Suscripciones
            </button>
            <button
              onClick={() => setTab("packs")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                tab === "packs" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Paquetes
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Subscriptions */}
        {tab === "subscriptions" && (
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col ${
                  plan.popular
                    ? "glass-strong shadow-lg ring-1 ring-primary/30 scale-[1.02] sm:scale-[1.04] z-10"
                    : "glass shadow-sm hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary text-white border-0 rounded-full px-4 py-1 text-xs font-bold shadow-md">
                      Más Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6 mt-1">
                  <p className="text-lg font-semibold mb-1">{plan.name}</p>
                  {plan.priceUSD > 0 ? (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`font-bold text-on-surface ${plan.popular ? "text-3xl" : "text-2xl"}`}>
                          ${plan.priceUSD.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">/{plan.period}</span>
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        ≈ {plan.priceCUP.toLocaleString("es-CU")} CUP
                      </p>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-bold text-on-surface">Gratis</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? "text-primary" : ""}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.priceUSD > 0 ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleSubscribe(plan.id, "stripe")}
                      disabled={loading === `${plan.id}_stripe`}
                      className={`w-full rounded-full py-5 transition-all ${
                        plan.popular
                          ? "gradient-primary text-white border-0 shadow-md hover:shadow-lg font-bold"
                          : "bg-background hover:bg-muted text-foreground border border-outline/30"
                      }`}
                    >
                      {loading === `${plan.id}_stripe` ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <DollarSign className="w-4 h-4 mr-2" />
                      )}
                      {loading === `${plan.id}_stripe` ? "Procesando..." : "Tarjeta (Stripe)"}
                    </Button>
                    <Button
                      onClick={() => handleSubscribe(plan.id, "qvapay")}
                      disabled={loading === `${plan.id}_qvapay`}
                      variant="outline"
                      className="w-full rounded-full py-5"
                    >
                      {loading === `${plan.id}_qvapay` ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <WalletCards className="w-4 h-4 mr-2" />
                      )}
                      {loading === `${plan.id}_qvapay` ? "Procesando..." : "Cripto (QvaPay)"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => window.location.href = "/analysis"}
                    className="w-full rounded-full py-5 bg-background text-foreground border border-outline/30"
                  >
                    Comenzar Gratis
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Packs */}
        {tab === "packs" && (
          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col ${
                  pack.popular
                    ? "glass-strong shadow-lg ring-1 ring-primary/30 scale-[1.02] sm:scale-[1.04] z-10"
                    : "glass shadow-sm hover:shadow-md"
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary text-white border-0 rounded-full px-4 py-1 text-xs font-bold shadow-md">
                      Más Popular
                    </Badge>
                  </div>
                )}

                {!pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs border-outline/30 text-muted-foreground">
                      {pack.analyses} análisis
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6 mt-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-lg font-semibold mb-1">{pack.name}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`font-bold text-on-surface ${pack.popular ? "text-3xl" : "text-2xl"}`}>
                      ${pack.priceUSD.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    ≈ {pack.priceCUP.toLocaleString("es-CU")} CUP
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {pack.analyses} análisis · Sin caducidad
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {pack.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${pack.popular ? "text-primary" : ""}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleBuyPack(pack.id, "stripe")}
                    disabled={loading === `${pack.id}_stripe`}
                    className={`w-full rounded-full py-5 transition-all ${
                      pack.popular
                        ? "gradient-primary text-white border-0 shadow-md hover:shadow-lg font-bold"
                        : "bg-background hover:bg-muted text-foreground border border-outline/30"
                    }`}
                  >
                    {loading === `${pack.id}_stripe` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <DollarSign className="w-4 h-4 mr-2" />
                    )}
                    {loading === `${pack.id}_stripe` ? "Procesando..." : "Tarjeta (Stripe)"}
                  </Button>
                  <Button
                    onClick={() => handleBuyPack(pack.id, "qvapay")}
                    disabled={loading === `${pack.id}_qvapay`}
                    variant="outline"
                    className="w-full rounded-full py-5"
                  >
                    {loading === `${pack.id}_qvapay` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <WalletCards className="w-4 h-4 mr-2" />
                    )}
                    {loading === `${pack.id}_qvapay` ? "Procesando..." : "Cripto (QvaPay)"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Currencies badge */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
          <span className="text-xs text-muted-foreground mr-2">Aceptamos:</span>
          <Badge variant="outline" className="rounded-full px-3 py-1.5 gap-1.5 text-xs border-outline/30">
            <DollarSign className="w-3 h-3 text-primary" />
            USD
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1.5 gap-1.5 text-xs border-outline/30">
            <Coins className="w-3 h-3 text-primary" />
            CUP
            <span className="text-muted-foreground/60">1 USD ≈ {CUP_RATE} CUP</span>
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-md mx-auto mt-6">
          Pagos procesados de forma segura a través de Stripe y QvaPay.
          No almacenamos información de pago.
        </p>
      </div>
    </div>
  )
}
