"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Download, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ListSkeleton } from "@/components/ui/skeleton"

interface PurchasedGuide {
  id: string
  title: string
  slug: string
  description: string
  image: string
  category: string
  price: number
  purchaseDate: string
  downloadUrl: string | null
}

export default function DashboardGuidesPage() {
  const { data: session, status } = useSession()
  const [guides, setGuides] = useState<PurchasedGuide[]>([])
  const [loading, setLoading] = useState(true)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ListSkeleton rows={3} />
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=/dashboard/guides")

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/user/guides", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setGuides(d?.data?.guides || [])
        setLoading(false)
      })
      .catch(() => {
        toast.error("Error al cargar datos")
        setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Badge variant="mint" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <BookOpen className="w-3.5 h-3.5 mr-2" />
            Mis Guías
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
            Guías Compradas
          </h1>
          <p className="text-[#666666] mt-1 text-sm">
            Accede a todas las guías que has comprado.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#88B078] mx-auto" />
          </div>
        ) : guides.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <BookOpen className="w-12 h-12 text-[#E8E8E8] mx-auto mb-4" />
              <h3 className="font-medium text-[#1A1A1A] mb-2">
                Aún no has comprado guías
              </h3>
              <p className="text-sm text-[#666666] mb-4">
                Explora nuestra tienda de guías de skincare.
              </p>
              <Link href="/guides">
                <Button variant="primary">
                  Ver guías disponibles
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {guides.map((guide) => (
              <Card key={guide.id} className="p-5 hover:shadow-md transition-shadow">
                <CardContent className="p-0 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#E2ECE0] flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-[#88B078]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-[#1A1A1A] truncate">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-[#666666] truncate">
                      {guide.description}
                    </p>
                    <p className="text-xs text-[#9BAA93] mt-1">
                      Comprado: {new Date(guide.purchaseDate).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {guide.downloadUrl ? (
                      <a href={guide.downloadUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="primary" size="sm">
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Descargar
                        </Button>
                      </a>
                    ) : (
                      <Link href={`/guides`}>
                        <Button variant="secondary" size="sm">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Ver
                        </Button>
                      </Link>
                    )}
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
