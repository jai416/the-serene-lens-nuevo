"use client"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8FAF5]">
      <div className="w-full max-w-md bg-white border border-[#DDE7D3] rounded-[20px] shadow-[0_1px_3px_rgba(47,58,45,0.04),0_2px_8px_rgba(47,58,45,0.06)] p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#E07070]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-semibold mb-3 text-[#2F3A2D]">Algo salió mal</h1>
        <p className="text-sm text-[#64705E] mb-6">
          Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center text-sm font-medium transition-all bg-[#C2E09D] text-[#2F3A2D] hover:bg-[#B0D48E] rounded-xl h-10 px-6 py-2.5"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center text-sm font-medium transition-all bg-white border border-[#DDE7D3] text-[#2F3A2D] hover:bg-[#F8FAF5] rounded-xl h-10 px-6 py-2.5"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
