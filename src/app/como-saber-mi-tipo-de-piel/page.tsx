import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cómo Saber Mi Tipo de Piel - Guía Gratis | The Serene Lens",
  description: "Descubre cómo identificar tu tipo de piel con una guía completa y un análisis de IA gratuito. Grasa, seca, mixta, normal o sensible.",
  openGraph: {
    title: "Cómo Saber Mi Tipo de Piel",
    description: "Guía completa para identificar tu tipo de piel. Análisis gratuito con inteligencia artificial.",
    url: "https://theserenelens.com/como-saber-mi-tipo-de-piel",
  },
}

export default function ComoSaberMiTipoDePielPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF5] p-6">
      <article className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2F3A2D] mb-4">
          Cómo Saber Mi Tipo de Piel
        </h1>
        <p className="text-lg text-[#64705E] mb-8 leading-relaxed">
          Conocer tu tipo de piel es el primer paso para elegir los productos correctos.
          En esta guía te explicamos cómo identificarlo y por qué es tan importante.
        </p>

        <div className="prose prose-lg max-w-none space-y-6 text-[#2F3A2D]">
          <h2 className="text-xl font-semibold">¿Por qué es importante saber tu tipo de piel?</h2>
          <p className="text-[#64705E] leading-relaxed">
            Cada tipo de piel tiene necesidades diferentes. Usar productos inadecuados puede empeorar problemas como acné, sequedad o sensibilidad. Cuando conoces tu tipo de piel, puedes elegir productos que realmente funcionen para ti.
          </p>

          <h2 className="text-xl font-semibold">Los 5 tipos de piel</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-[#DDE7D3] p-4">
              <h3 className="font-semibold text-[#2F3A2D]">Piel grasa</h3>
              <p className="text-sm text-[#64705E]">Brillo excesivo, poros visibles, propensa al acné. Necesita productos oil-free y no comedogénicos.</p>
            </div>
            <div className="bg-white rounded-xl border border-[#DDE7D3] p-4">
              <h3 className="font-semibold text-[#2F3A2D]">Piel seca</h3>
              <p className="text-sm text-[#64705E]">Tensión, descamación, textura irregular. Necesita hidratación intensa y protección.</p>
            </div>
            <div className="bg-white rounded-xl border border-[#DDE7D3] p-4">
              <h3 className="font-semibold text-[#2F3A2D]">Piel mixta</h3>
              <p className="text-sm text-[#64705E]">Zona T grasa, mejillas normales o secas. Necesita tratamientos diferenciados por zona.</p>
            </div>
            <div className="bg-white rounded-xl border border-[#DDE7D3] p-4">
              <h3 className="font-semibold text-[#2F3A2D]">Piel normal</h3>
              <p className="text-sm text-[#64705E]">Equilibrada, pocos problemas visibles. Mantenimiento básico con limpieza e hidratación.</p>
            </div>
            <div className="bg-white rounded-xl border border-[#DDE7D3] p-4">
              <h3 className="font-semibold text-[#2F3A2D]">Piel sensible</h3>
              <p className="text-sm text-[#64705E]">Reacciones frecuentes, enrojecimiento, irritación. Productos hipoalergénicos y sin fragancia.</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold">¿Cómo identificar tu tipo de piel?</h2>
          <p className="text-[#64705E] leading-relaxed">
            Puedes hacer el famoso &quot;test del papel&quot; o simplemente observar tu piel por la mañana. Pero la forma más precisa es usar una herramienta de análisis con inteligencia artificial que observa tu piel directamente.
          </p>

          <div className="bg-[#C2E09D]/20 rounded-xl p-6 text-center">
            <p className="text-[#2F3A2D] font-semibold mb-2">
              ¿Quieres saber tu tipo de piel exacto?
            </p>
            <p className="text-sm text-[#64705E] mb-4">
              Usa The Serene Lens, nuestra herramienta gratuita que analiza tu piel con IA y te recomienda productos personalizados.
            </p>
            <Link
              href="/analysis"
              className="inline-block bg-[#C2E09D] text-[#2F3A2D] font-semibold px-6 py-2 rounded-xl hover:bg-[#B0D48E] transition-colors"
            >
              Analizar mi piel gratis →
            </Link>
          </div>
        </div>

        <p className="text-xs text-[#8A9A82] mt-8">
          Esta herramienta ofrece observaciones cosméticas orientativas, no diagnósticos médicos.
        </p>
      </article>
    </div>
  )
}
