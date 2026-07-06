"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
          Algo salió mal
        </h1>
        <p className="text-sm text-[#666666] mb-6">
          Hubo un error al cargar esta página. Puede deberse a un reinicio del servidor.
          Intenta recargar.
        </p>
        <Button variant="primary" onClick={reset} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      </div>
    </div>
  )
}