"use client"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF5]">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-[#C2E09D] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📶</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#2F3A2D] mb-2">
          Estás offline
        </h1>
        <p className="text-[#64705E] mb-6">
          No te preocupes, nuestra app está diseñada para funcionar sin conexión.
          Vuelve cuando tengas internet para continuar.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#C2E09D] text-[#2F3A2D] rounded-xl font-medium hover:bg-[#B0D48E] transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
