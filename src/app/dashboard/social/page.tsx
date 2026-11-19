"use client"

import { redirect, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"
import { Users } from "lucide-react"
import { CardSkeleton } from "@/components/ui/skeleton"

export default function SocialPage() {
  const { locale } = useLocale()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F8F9FA" }}>
        <CardSkeleton />
      </div>
    )
  }
  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#E2ECE0] flex items-center justify-center mb-6">
        <Users className="w-8 h-8 text-[#1A1A1A]" />
      </div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{t("social.title", locale)}</h1>
      <p className="text-[#666666] max-w-md">
        {t("social.comingSoon", locale)}
      </p>
    </div>
  )
}
