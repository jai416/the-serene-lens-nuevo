"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"

interface Badge {
  id: string
  slug: string
  name: string
  description: string
  icon: string
}

interface UserBadge {
  id: string
  earnedAt: string
  badge: Badge
}

export function BadgeDisplay() {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/badges")
      .then((res) => res.ok ? res.json() : { data: { badges: [] } })
      .then((data) => {
        const raw = data?.data?.badges || data?.badges || []
        setBadges(Array.isArray(raw) ? raw : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || badges.length === 0) return null

  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-[#1A1A1A]">
          <Trophy className="w-5 h-5" />
          Tus Insignias
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-wrap gap-3">
          {badges.map((ub) => (
            <div
              key={ub.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFF9E6] border border-[#FCEAA6]/50"
              title={ub.badge.description}
            >
              <span className="text-lg">{ub.badge.icon}</span>
              <span className="text-sm font-medium text-[#1A1A1A]">{ub.badge.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
