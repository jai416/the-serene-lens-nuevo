import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Test de Tipo de Piel Gratis con IA | The Serene Lens",
  description: "Descubre tu tipo de piel (grasa, seca, mixta, normal, sensible) con un análisis de IA gratuito. Solo sube una foto.",
  openGraph: {
    title: "Test de Tipo de Piel Gratis",
    description: "¿Tienes piel grasa, seca o mixta? Nuestra IA analiza tu piel y te dice tu tipo exacto.",
    url: "https://theserenelens.com/test-tipo-de-piel",
  },
}

export default function TestTipoDePielPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF5] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-[#ECFFD3] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🔬</span>
        </div>
        <h1 className="text-3xl font-bold text-[#2F3A2D] mb-4">
          ¿Cuál es tu tipo de piel?
        </h1>
        <p className="text-lg text-[#64705E] mb-8 leading-relaxed">
          ¿Piel grasa? ¿Piel seca? ¿Piel mixta? Descúbrelo con un análisis de inteligencia artificial que observa tu piel directamente.
        </p>
        <div className="bg-white rounded-2xl border border-[#DDE7D3] p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2F3A2D] mb-3">Tipos de piel que analizamos</h2>
          <div className="grid grid-cols-1 gap-2 text-left text-sm text-[#64705E]">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF5]">
              <span className="w-2 h-2 bg-[#C2E09D] rounded-full" />
              <span><strong>Piel grasa</strong> — Brillo excesivo, poros visibles</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF5]">
              <span className="w-2 h-2 bg-[#ECFFD3] rounded-full" />
              <span><strong>Piel seca</strong> — Tensión, descamación, textura irregular</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF5]">
              <span className="w-2 h-2 bg-[#FFF6AD] rounded-full" />
              <span><strong>Piel mixta</strong> — Zona T grasa, mejillas secas</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF5]">
              <span className="w-2 h-2 bg-[#C2E09D] rounded-full" />
              <span><strong>Piel normal</strong> — Equilibrada, pocos problemas</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF5]">
              <span className="w-2 h-2 bg-[#ECFFD3] rounded-full" />
              <span><strong>Piel sensible</strong> — Reacciones frecuentes, enrojecimiento</span>
            </div>
          </div>
        </div>
        <Link
          href="/analysis"
          className="inline-block bg-[#C2E09D] text-[#2F3A2D] font-semibold px-8 py-3 rounded-xl hover:bg-[#B0D48E] transition-colors"
        >
          Hacer mi test ahora →
        </Link>
        <p className="text-xs text-[#8A9A82] mt-6">
          Análisis cosmético, no diagnóstico médico. Resultados basados en observación visual.
        </p>
      </div>
    </div>
  )
}
