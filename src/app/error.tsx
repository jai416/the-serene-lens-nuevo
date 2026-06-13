"use client"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 sm:p-12 max-w-md w-full text-center shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-semibold mb-3">Algo salió mal</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="gradient-primary text-white rounded-full px-6 py-2.5 text-sm font-medium hover:shadow-md transition-all"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="bg-background text-foreground border border-outline/30 rounded-full px-6 py-2.5 text-sm font-medium hover:bg-muted transition-all"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
