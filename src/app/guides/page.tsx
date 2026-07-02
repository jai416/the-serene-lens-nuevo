"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Download, Loader2, ShoppingCart, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { getCsrfToken } from "@/lib/csrf-client"

interface Guide {
  id: string
  title: string
  slug: string
  description: string
  shortDesc: string | null
  image: string
  category: string
  price: number
  fileUrl?: string | null
}

interface PurchasedGuide {
  id: string
  digitalProductId: string
  status: string
  downloadUrl: string | null
}

export default function GuidesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [guides, setGuides] = useState<Guide[]>([])
  const [purchased, setPurchased] = useState<Record<string, PurchasedGuide>>({})
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [verifyingGuide, setVerifyingGuide] = useState<string | null>(null)

  const loadPurchased = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch("/api/user/guides")
      const data = await res.json()
      const map: Record<string, PurchasedGuide> = {}
      const items = data?.data?.purchases || data?.purchases || []
      for (const item of items) {
        map[item.digitalProductId] = item
      }
      setPurchased(map)
    } catch {}
  }, [session])

  useEffect(() => {
    fetch("/api/guides")
      .then((r) => r.json())
      .then((d) => {
        setGuides(d?.data?.guides || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadPurchased()
  }, [loadPurchased])

  useEffect(() => {
    const successGuideId = searchParams.get("success")
    const qvapayId = searchParams.get("payment_id") || searchParams.get("transaction_uuid")

    if (successGuideId && qvapayId) {
      setVerifyingGuide(successGuideId)
      fetch("/api/payments/verify-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ qvapayId }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.data?.completed || d?.data?.alreadyCompleted) {
            toast.success("¡Guía desbloqueada! Ya puedes descargarla.")
            loadPurchased()
          } else {
            toast.info("Pago pendiente de confirmación. Espera unos minutos.")
          }
        })
        .catch(() => toast.error("No se pudo verificar el pago"))
        .finally(() => setVerifyingGuide(null))
    }
  }, [searchParams, loadPurchased])

  const handlePurchase = async (guide: Guide) => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/guides")}`)
      return
    }

    if (session.user.role === "ADMIN") {
      if (guide.fileUrl) {
        window.open(guide.fileUrl, "_blank")
      } else {
        toast.error("Esta guía no tiene archivo para descargar")
      }
      return
    }

    if (purchased[guide.id]?.status === "completed") {
      const dl = purchased[guide.id].downloadUrl
      if (dl) window.open(dl, "_blank")
      return
    }

    setPurchasing(guide.id)
    try {
      const res = await fetch("/api/payments/create-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ guideId: guide.id }),
      })
      const data = await res.json()

      if (data?.data?.alreadyPurchased) {
        toast.success("Ya compraste esta guía")
        loadPurchased()
        return
      }

      if (data?.data?.url || data.url) {
        window.location.href = data.data?.url || data.url
      } else {
        toast.error(data.error?.message || data.error || "Error al procesar pago")
      }
    } catch {
      toast.error("Error al procesar pago")
    } finally {
      setPurchasing(null)
    }
  }

  const getButtonState = (guide: Guide) => {
    if (session?.user?.role === "ADMIN") {
      return { label: "Acceder", icon: <Download className="w-3.5 h-3.5" />, disabled: false }
    }

    const p = purchased[guide.id]
    if (p?.status === "completed") {
      return { label: "Descargar", icon: <Download className="w-3.5 h-3.5" />, disabled: false }
    }

    if (p?.status === "pending") {
      return { label: "Verificar", icon: <Loader2 className="w-3.5 h-3.5" />, disabled: false }
    }

    if (verifyingGuide === guide.id) {
      return { label: "Verificando...", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, disabled: true }
    }

    return { label: "Comprar", icon: <ShoppingCart className="w-3.5 h-3.5" />, disabled: purchasing === guide.id }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-pulse text-[#C2E09D]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <BookOpen className="w-3.5 h-3.5 mr-2" />
            Guías Digitales
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6]">
            Guías de Skincare
          </h1>
          <p className="text-[#64705E] dark:text-[#9BAA93] mt-2 max-w-xl mx-auto">
            Guías prácticas y profesionales para cuidar tu piel. Compra una vez, consulta siempre.
          </p>
        </div>

        {guides.length === 0 ? (
          <Card className="p-8">
            <CardContent className="p-0 text-center">
              <BookOpen className="w-12 h-12 text-[#DDE7D3] mx-auto mb-4" />
              <h3 className="font-medium text-[#2F3A2D] mb-2">Próximamente</h3>
              <p className="text-sm text-[#64705E]">
                Estamos preparando guías exclusivas para ti.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {guides.map((guide) => {
              const btn = getButtonState(guide)
              const isPurchased = purchased[guide.id]?.status === "completed"

              return (
                <Card key={guide.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[16/9] bg-[#F0F5EC] relative">
                    <img
                      src={guide.image}
                      alt={guide.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-3 left-3 bg-[#C2E09D] text-[#2F3A2D]">
                      {guide.category}
                    </Badge>
                    {isPurchased && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-6 h-6 text-[#C2E09D] drop-shadow" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-serif text-lg font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-[#64705E] dark:text-[#9BAA93] mb-4 line-clamp-2">
                      {guide.shortDesc || guide.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-[#2F3A2D] dark:text-[#E8EDE6]">
                        {session?.user?.role === "ADMIN" ? (
                          <span className="text-[#C2E09D]">Gratis (Admin)</span>
                        ) : isPurchased ? (
                          <span className="text-[#C2E09D] text-sm">Comprada</span>
                        ) : (
                          `$${guide.price.toFixed(2)}`
                        )}
                      </span>
                      <Button
                        variant={isPurchased ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => handlePurchase(guide)}
                        disabled={btn.disabled}
                        className="gap-1"
                      >
                        {btn.icon}
                        {btn.label}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
