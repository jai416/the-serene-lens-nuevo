import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rutina Skincare Personalizada con IA | The Serene Lens",
  description: "Obtén una rutina de skincare personalizada según tu tipo de piel y preocupaciones. Analiza tu piel con IA y recibe recomendaciones.",
  openGraph: {
    title: "Rutina Skincare Personalizada",
    description: "Rutina de skincare personalizada según tu tipo de piel. Análisis gratuito con IA.",
    url: "https://theserenelens.com/rutina-skincare-personalizada",
  },
}

export default function RutinaSkincarePersonalizadaPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF5] p-6">
      <article className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2F3A2D] mb-4">
          Rutina Skincare Personalizada
        </h1>
        <p className="text-lg text-[#64705E] mb-8 leading-relaxed">
          No todas las pieles son iguales. Una rutina efectiva debe adaptarse a tu tipo de piel, tus preocupaciones y tu estilo de vida.
        </p>

        <div className="prose prose-lg max-w-none space-y-6 text-[#2F3A2D]">
          <h2 className="text-xl font-semibold">Rutina básica de mañana</h2>
          <ol className="space-y-2 text-[#64705E] list-decimal list-inside">
            <li><strong>Limpieza:</strong> Lávate la cara con un limpiador suave adecuado para tu tipo de piel</li>
            <li><strong>Tratamiento:</strong> Aplica sérum con ingredientes activos (vitamina C, niacinamida, etc.)</li>
            <li><strong>Hidratación:</strong> Usa una crema hidratante ligera que no obstruya los poros</li>
            <li><strong>Protector solar:</strong> Aplica SPF 30+ como último paso (siempre)</li>
          </ol>

          <h2 className="text-xl font-semibold">Rutina básica de noche</h2>
          <ol className="space-y-2 text-[#64705E] list-decimal list-inside">
            <li><strong>Desmaquillaje:</strong> Elimina maquillaje y protector solar</li>
            <li><strong>Limpieza:</strong> Limpia tu piel con un limpiador más profundo</li>
            <li><strong>Tratamiento:</strong> Aplica retinol, ácido glicólico o ingredientes activos nocturnos</li>
            <li><strong>Hidratación:</strong> Usa una crema hidratante más rica que la de mañana</li>
          </ol>

          <h2 className="text-xl font-semibold">Ingredientes según tu tipo de piel</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-[#DDE7D3] p-4">
              <h3 className="font-semibold text-[#2F3A2D]">Piel grasa</h3>
              <p className="text-sm text-[#64705E]">Niacinamida, ácido salicílico, ácido hialurónico, zinc</p>
            </div>
            <div className="bg-white rounded-xl border border-[#DDE7D3] p-4">
              <h3 className="font-semibold text-[#2F3A2D]">Piel seca</h3>
              <p className="text-sm text-[#64705E]">Ácido hialurónico, ceramidas, squalane, pantenol</p>
            </div>
            <div className="bg-white rounded-xl border border-[#DDE7D3] p-4">
              <h3 className="font-semibold text-[#2F3A2D]">Piel mixta</h3>
              <p className="text-sm text-[#64705E]">Niacinamida, ácido hialurónico, aceites ligeros</p>
            </div>
            <div className="bg-white rounded-xl border border-[#DDE7D3] p-4">
              <h3 className="font-semibold text-[#2F3A2D]">Piel sensible</h3>
              <p className="text-sm text-[#64705E]">Centella asiática, aloe vera, avena, bisabolol</p>
            </div>
          </div>

          <div className="bg-[#C2E09D]/20 rounded-xl p-6 text-center">
            <p className="text-[#2F3A2D] font-semibold mb-2">
              ¿Quieres una rutina personalizada para tu piel?
            </p>
            <p className="text-sm text-[#64705E] mb-4">
              The Serene Lens analiza tu piel con IA y te recomienda productos y rutinas personalizados.
            </p>
            <Link
              href="/analysis"
              className="inline-block bg-[#C2E09D] text-[#2F3A2D] font-semibold px-6 py-2 rounded-xl hover:bg-[#B0D48E] transition-colors"
            >
              Obtener mi rutina personalizada →
            </Link>
          </div>
        </div>

        <p className="text-xs text-[#8A9A82] mt-8">
          Las recomendaciones son cosméticas, no diagnósticos médicos. Consulta a un dermatólogo para problemas específicos.
        </p>
      </article>
    </div>
  )
}
