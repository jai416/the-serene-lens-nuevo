"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Share2, Loader2, Copy, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface Comparison {
  id: string
  name: string
  image: string | null
  skinType: string
  observations: string[]
  isYou: boolean
}

interface SocialData {
  hasComparison: boolean
  myName: string
  comparisons: Comparison[]
  friendCount: number
  message?: string
}

const skinTypeColors: Record<string, string> = {
  "Piel Grasa": "bg-[#FFF6AD] text-[#2F3A2D]",
  "Piel Seca": "bg-[#DBEAFE] text-[#1E3A5F]",
  "Piel Mixta": "bg-[#FCE7F3] text-[#9D174D]",
  "Piel Normal": "bg-[#D1FAE5] text-[#065F46]",
  "Piel Sensible": "bg-[#FEE2E2] text-[#991B1B]",
}

function getSkinColor(type: string): string {
  for (const [key, val] of Object.entries(skinTypeColors)) {
    if (type.toLowerCase().includes(key.toLowerCase().replace("piel ", ""))) return val
  }
  return "bg-[#F0F5EC] text-[#2F3A2D]"
}

export function SocialComparison() {
  const { data: session } = useSession()
  const [data, setData] = useState<SocialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetch("/api/user/social-comparison")
        .then((r) => r.json())
        .then((d) => {
          setData(d?.data || d)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  const shareComparison = () => {
    if (!data?.comparisons) return

    const text = data.comparisons
      .map((c) => `${c.isYou ? "Tú" : c.name}: ${c.skinType}`)
      .join("\n")

    const shareText = `🌿 Descubre cómo está tu piel comparada con tus amigos:\n\n${text}\n\n¡Haz tu análisis gratis en The Serene Lens!`

    if (navigator.share) {
      navigator.share({
        title: "Mi comparación de piel",
        text: shareText,
        url: window.location.origin,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success("Comparación copiada al portapapeles")
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <CardContent className="p-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-pulse text-[#C2E09D]" />
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.hasComparison) {
    return (
      <Card className="p-6">
        <CardContent className="p-0 text-center">
          <Users className="w-10 h-10 text-[#DDE7D3] mx-auto mb-3" />
          <h3 className="font-medium text-[#2F3A2D] mb-1">Modo Social</h3>
          <p className="text-sm text-[#64705E] mb-3">
            {data?.message || "Invita a amigos para ver la comparación."}
          </p>
          <a href="/dashboard/referrals">
            <Button variant="outline" size="sm" className="gap-1">
              <Users className="w-3.5 h-3.5" />
              Invitar amigos
            </Button>
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-[#2F3A2D] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C2E09D]" />
            Comparación con amigos
          </h3>
          <Badge variant="secondary" className="text-xs">
            {data.friendCount} amigos
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          {data.comparisons.map((person) => (
            <div
              key={person.id}
              className={`flex items-center justify-between p-3 rounded-xl ${
                person.isYou
                  ? "bg-[#C2E09D]/10 border border-[#C2E09D]"
                  : "bg-[#F8FAF5]"
              }`}
            >
              <div className="flex items-center gap-3">
                {person.image ? (
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#DDE7D3] flex items-center justify-center">
                    <span className="text-xs font-medium text-[#64705E]">
                      {person.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[#2F3A2D]">
                    {person.isYou ? "Tú" : person.name}
                  </p>
                  <p className="text-xs text-[#64705E]">
                    {person.observations.length > 0
                      ? person.observations[0]
                      : "Sin observaciones"}
                  </p>
                </div>
              </div>
              <Badge className={`text-xs ${getSkinColor(person.skinType)}`}>
                {person.skinType}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={shareComparison}
            className="flex-1 gap-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const text = data.comparisons
                .map((c) => `${c.isYou ? "Tú" : c.name}: ${c.skinType}`)
                .join(" | ")
              navigator.clipboard.writeText(text)
              toast.success("Copiado")
            }}
            className="gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
