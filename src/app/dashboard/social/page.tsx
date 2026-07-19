"use client"

import { redirect, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

export default function SocialPage() {
  const { locale } = useLocale()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  if (status === "loading") return null
  if (!session) redirect("/login?callbackUrl=" + encodeURIComponent(pathname))

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#E2ECE0] flex items-center justify-center mb-6">
        <span className="text-3xl">👥</span>
      </div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{t("social.title", locale)}</h1>
      <p className="text-[#666666] max-w-md">
        {t("social.comingSoon", locale)}
      </p>
    </div>
  )
}
