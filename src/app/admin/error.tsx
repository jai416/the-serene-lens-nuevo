"use client"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-semibold text-[#E2E8F0] mb-2">
        Error del sistema
      </h2>
      <p className="text-[#8892B0] mb-6 max-w-md">
        Ocurrió un error inesperado. El equipo ha sido notificado.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 rounded-xl bg-[#7C8CFF] text-white hover:bg-[#6B7AE8] transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
