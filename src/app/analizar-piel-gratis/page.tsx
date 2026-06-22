import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Análisis de Piel Gratis con IA | The Serene Lens",
  description: "Sube una foto de tu piel y recibe un análisis cosmético personalizado con inteligencia artificial. Gratis y sin registro.",
  openGraph: {
    title: "Análisis de Piel Gratis con IA",
    description: "Analiza tu piel con inteligencia artificial. Recomendaciones personalizadas, gratis y sin registro.",
    url: "https://theserenelens.com/analizar-piel-gratis",
  },
}

export default function AnalizarPielGratisPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF5] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-[#C2E09D] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🌸</span>
        </div>
        <h1 className="text-3xl font-bold text-[#2F3A2D] mb-4">
          Análisis de Piel Gratis con IA
        </h1>
        <p className="text-lg text-[#64705E] mb-8 leading-relaxed">
          Sube una foto de tu piel y recibe un análisis cosmético personalizado con inteligencia artificial.
          Sin porcentajes inventados ni diagnósticos médicos.
        </p>
        <div className="bg-white rounded-2xl border border-[#DDE7D3] p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2F3A2D] mb-3">¿Cómo funciona?</h2>
          <div className="space-y-3 text-left text-[#64705E] text-sm">
            <div className="flex items-start gap-3">
              <span className="bg-[#C2E09D] text-[#2F3A2D] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <p>Sube 2-4 fotos de tu piel (frontal, perfil izquierdo, perfil derecho)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-[#C2E09D] text-[#2F3A2D] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <p>Responde preguntas sobre tu rutina y tipo de piel</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-[#C2E09D] text-[#2F3A2D] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <p>Recibe tu análisis cosmético con recomendaciones personalizadas</p>
            </div>
          </div>
        </div>
        <Link
          href="/analysis"
          className="inline-block bg-[#C2E09D] text-[#2F3A2D] font-semibold px-8 py-3 rounded-xl hover:bg-[#B0D48E] transition-colors"
        >
          Analizar mi piel ahora →
        </Link>
        <p className="text-xs text-[#8A9A82] mt-6">
          Esta herramienta ofrece observaciones cosméticas orientativas, no diagnósticos médicos.
        </p>
      </div>
    </div>
  )
}
