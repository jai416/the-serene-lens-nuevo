"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Download, Loader2, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

interface Guide {
  id: string
  title: string
  slug: string
  description: string
  shortDesc: string | null
  image: string
  category: string
  price: number
}

export default function GuidesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/guides")
      .then((r) => r.json())
      .then((d) => {
        setGuides(d?.data?.guides || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handlePurchase = async (guide: Guide) => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/guides")}`)
      return
    }

    if (session.user.role === "ADMIN") {
      toast.success("Acceso de administrador: guía gratuita")
      return
    }

    setPurchasing(guide.id)
    try {
      const res = await fetch("/api/payments/create-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideId: guide.id }),
      })
      const data = await res.json()

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
            {guides.map((guide) => (
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
                      ) : (
                        `$${guide.price.toFixed(2)}`
                      )}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePurchase(guide)}
                      disabled={purchasing === guide.id}
                      className="gap-1"
                    >
                      {purchasing === guide.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-pulse" />
                      ) : session?.user?.role === "ADMIN" ? (
                        <Download className="w-3.5 h-3.5" />
                      ) : (
                        <ShoppingCart className="w-3.5 h-3.5" />
                      )}
                      {session?.user?.role === "ADMIN" ? "Acceder" : "Comprar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
