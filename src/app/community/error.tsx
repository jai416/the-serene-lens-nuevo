"use client"

import { Button } from "@/components/ui/button"

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
        Comunidad no disponible
      </h2>
      <p className="text-[#666666] mb-6 max-w-md">
        No pudimos cargar la comunidad. Verifica tu conexión e intenta de nuevo.
      </p>
      <Button onClick={reset} className="bg-[#88B078] text-[#1A1A1A] hover:bg-[#B0D08C]">
        Reintentar
      </Button>
    </div>
  )
}
