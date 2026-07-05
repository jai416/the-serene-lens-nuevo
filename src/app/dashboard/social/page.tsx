"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { SocialComparison } from "@/components/social-comparison"
import { CardSkeleton } from "@/components/ui/skeleton"

export default function DashboardSocialPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CardSkeleton />
      </div>
    )
  }

  if (!session) redirect("/login?callbackUrl=/dashboard/social")

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Badge variant="primary" className="mb-4 rounded-full px-4 py-1.5 border-0">
            <Users className="w-3.5 h-3.5 mr-2" />
            Modo Social
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#3D3229] dark:text-[#E8DED5]">
            Compara con amigos
          </h1>
          <p className="text-[#8A7A6A] dark:text-[#A89888] mt-1 text-sm">
            Comparte tus resultados de forma anónima y Compara con tus amigos.
          </p>
        </div>

        <SocialComparison />

        <Card className="p-6 mt-6">
          <CardContent className="p-0">
            <h2 className="font-serif text-lg font-semibold mb-3 text-[#3D3229] dark:text-[#E8DED5]">
              ¿Cómo funciona?
            </h2>
            <ul className="space-y-2 text-sm text-[#8A7A6A] dark:text-[#A89888]">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E8D5C4] text-[#3D3229] text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Invita a tus amigos a unirse con tu código de referido</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E8D5C4] text-[#3D3229] text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Tus resultados se comparan de forma anónima por tipo de piel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E8D5C4] text-[#3D3229] text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Descubre cómo se comparan tus resultados con el promedio</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
