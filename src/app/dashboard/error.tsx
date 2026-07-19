"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { useLocale } from "@/lib/locale/locale-context"
import { t } from "@/lib/locale/translations"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { locale } = useLocale()
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-[#88B078] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-[#1A1A1A]" />
        </div>
        <h1 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-2">
          {t("common.somethingWentWrong", locale)}
        </h1>
        <p className="text-sm text-[#666666] mb-6">
          {t("dashboard.errorLoading", locale)}
        </p>
        <Button variant="primary" onClick={reset} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t("common.retry", locale)}
        </Button>
      </div>
    </div>
  )
}