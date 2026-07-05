"use client"

import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-semibold text-[#2F3A2D] mb-2">
        Algo salió mal
      </h2>
      <p className="text-[#64705E] mb-6 max-w-md">
        Ocurrió un error al cargar esta sección. Por favor intenta de nuevo.
      </p>
      <Button onClick={reset} className="bg-[#C2E09D] text-[#2F3A2D] hover:bg-[#B0D08C]">
        Reintentar
      </Button>
    </div>
  )
}
