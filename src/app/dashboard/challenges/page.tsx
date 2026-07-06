"use client"

import { useSession } from "next-auth/react"
import { redirect, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Sparkles } from "lucide-react"

export default function ChallengesPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-32 bg-[#E2ECE0] animate-pulse rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <Trophy className="w-12 h-12 text-[#88B078] mx-auto mb-4" />
            <h1 className="font-serif text-3xl font-semibold text-[#1A1A1A] mb-2">
              Desafíos de Skincare
            </h1>
            <p className="text-[#666666] mb-4">
              Estamos preparando nuevos desafíos para ti. Pronto podrás completar retos y ganar puntos por tus hábitos de cuidado facial.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-[#666666]">
              <Sparkles className="w-4 h-4 text-[#88B078]" />
              <span>Próximamente</span>
              <Sparkles className="w-4 h-4 text-[#88B078]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
