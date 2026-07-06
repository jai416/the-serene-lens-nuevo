"use client"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8F9FA]">
      <div className="w-full max-w-md bg-white border border-[#E8E8E8] rounded-[20px] shadow-[0_1px_3px_rgba(47,58,45,0.04),0_2px_8px_rgba(47,58,45,0.06)] p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#E07070]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-semibold mb-3 text-[#1A1A1A]">Algo salió mal</h1>
        <p className="text-sm text-[#666666] mb-6">
          Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center text-sm font-medium transition-all bg-[#88B078] text-[#1A1A1A] hover:bg-[#78A068] rounded-xl h-10 px-6 py-2.5"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center text-sm font-medium transition-all bg-white border border-[#E8E8E8] text-[#1A1A1A] hover:bg-[#F8F9FA] rounded-xl h-10 px-6 py-2.5"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
