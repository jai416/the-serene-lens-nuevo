import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analizador de Ingredientes Cosméticos - Gratis | The Serene Lens",
  description: "Sube una foto de la etiqueta de tu producto y descubre qué ingredientes contiene. Análisis instantáneo con IA. Gratis y sin registro.",
  openGraph: {
    title: "Analizador de Ingredientes Cosméticos",
    description: "Analiza ingredientes de productos cosméticos con inteligencia artificial. Sube una foto y obtén el análisis completo.",
    url: "https://the-serene-lens-nuevo.onrender.com/ingredients-analyzer",
  },
}

export default function IngredientsAnalyzerPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF5] p-6">
      <article className="max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-[#ECFFD3] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🔍</span>
        </div>
        <h1 className="text-3xl font-bold text-[#2F3A2D] mb-4 text-center">
          Analizador de Ingredientes Cosméticos
        </h1>
        <p className="text-lg text-[#64705E] mb-8 text-center leading-relaxed">
          Sube una foto de la etiqueta de tu producto y descubre qué ingredientes contiene. Análisis instantáneo con inteligencia artificial.
        </p>

        <div className="bg-white rounded-2xl border border-[#DDE7D3] p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2F3A2D] mb-3">¿Qué analiza?</h2>
          <div className="space-y-3 text-sm text-[#64705E]">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0" />
              <div>
                <strong>Ingredientes beneficiosos</strong> — Componentes que aportan valor a tu piel
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 shrink-0" />
              <div>
                <strong>Ingredientes con precaución</strong> — Pueden causar reacciones en ciertos tipos de piel
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0" />
              <div>
                <strong>Ingredientes a evitar</strong> — Comúnmente evitados en cosmética
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DDE7D3] p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#2F3A2D] mb-3">¿Cómo funciona?</h2>
          <ol className="space-y-3 text-sm text-[#64705E] list-decimal list-inside">
            <li>Sube una foto clara de la lista de ingredientes del producto</li>
            <li>Nuestra IA extrae y analiza cada ingrediente</li>
            <li>Recibe un informe completo con clasificación por categorías</li>
            <li>Entiende qué es bueno para tu tipo de piel específico</li>
          </ol>
        </div>

        <div className="text-center">
          <Link
            href="/products"
            className="inline-block bg-[#C2E09D] text-[#2F3A2D] font-semibold px-8 py-3 rounded-xl hover:bg-[#B0D48E] transition-colors"
          >
            Escanear un producto ahora →
          </Link>
          <p className="text-xs text-[#8A9A82] mt-6">
            Análisis cosmético, no diagnóstico médico. Los resultados son orientativos.
          </p>
        </div>

        <div className="bg-[#C2E09D]/20 rounded-xl p-6 mt-8 text-center">
          <p className="text-[#2F3A2D] font-semibold mb-2">
            ¿También quieres analizar tu piel?
          </p>
          <p className="text-sm text-[#64705E] mb-4">
            Usa The Serene Lens para obtener un análisis cosmético completo de tu piel con inteligencia artificial.
          </p>
          <Link
            href="/analysis"
            className="inline-block bg-[#C2E09D] text-[#2F3A2D] font-semibold px-6 py-2 rounded-xl hover:bg-[#B0D48E] transition-colors"
          >
            Analizar mi piel gratis →
          </Link>
        </div>
      </article>
    </div>
  )
}
