import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Rutina Skincare Personalizada con IA | The Serene Lens",
  description: "Obtén una rutina de skincare personalizada según tu tipo de piel y preocupaciones. Analiza tu piel con IA y recibe recomendaciones.",
  openGraph: {
    title: "Rutina Skincare Personalizada",
    description: "Rutina de skincare personalizada según tu tipo de piel. Análisis gratuito con IA.",
    url: "https://the-serene-lens-nuevo.onrender.com/rutina-skincare-personalizada",
  },
}

export default function RutinaSkincarePersonalizadaPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <article className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
          Rutina Skincare Personalizada
        </h1>
        <p className="text-lg text-[#666666] mb-8 leading-relaxed">
          No todas las pieles son iguales. Una rutina efectiva debe adaptarse a tu tipo de piel, tus preocupaciones y tu estilo de vida.
        </p>

        <div className="prose prose-lg max-w-none space-y-6 text-[#1A1A1A]">
          <h2 className="text-xl font-semibold">Rutina básica de mañana</h2>
          <ol className="space-y-2 text-[#666666] list-decimal list-inside">
            <li><strong>Limpieza:</strong> Lávate la cara con un limpiador suave adecuado para tu tipo de piel</li>
            <li><strong>Tratamiento:</strong> Aplica sérum con ingredientes activos (vitamina C, niacinamida, etc.)</li>
            <li><strong>Hidratación:</strong> Usa una crema hidratante ligera que no obstruya los poros</li>
            <li><strong>Protector solar:</strong> Aplica SPF 30+ como último paso (siempre)</li>
          </ol>

          <h2 className="text-xl font-semibold">Rutina básica de noche</h2>
          <ol className="space-y-2 text-[#666666] list-decimal list-inside">
            <li><strong>Desmaquillaje:</strong> Elimina maquillaje y protector solar</li>
            <li><strong>Limpieza:</strong> Limpia tu piel con un limpiador más profundo</li>
            <li><strong>Tratamiento:</strong> Aplica retinol, ácido glicólico o ingredientes activos nocturnos</li>
            <li><strong>Hidratación:</strong> Usa una crema hidratante más rica que la de mañana</li>
          </ol>

          <h2 className="text-xl font-semibold">Ingredientes según tu tipo de piel</h2>
          <div className="space-y-3 not-prose">
            {[
              { title: "Piel grasa", desc: "Niacinamida, ácido salicílico, ácido hialurónico, zinc" },
              { title: "Piel seca", desc: "Ácido hialurónico, ceramidas, squalane, pantenol" },
              { title: "Piel mixta", desc: "Niacinamida, ácido hialurónico, aceites ligeros" },
              { title: "Piel sensible", desc: "Centella asiática, aloe vera, avena, bisabolol" },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#1A1A1A]">{item.title}</h3>
                  <p className="text-sm text-[#666666]">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-[#88B078]/20 border-[#88B078]">
            <CardContent className="p-6 text-center">
              <p className="text-[#1A1A1A] font-semibold mb-2">
                ¿Quieres una rutina personalizada para tu piel?
              </p>
              <p className="text-sm text-[#666666] mb-4">
                The Serene Lens analiza tu piel con IA y te recomienda productos y rutinas personalizados.
              </p>
              <Link
                href="/analysis"
                className={buttonVariants({ variant: "primary" })}
              >
                Obtener mi rutina personalizada →
              </Link>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-[#999999] mt-8">
          Las recomendaciones son cosméticas, no diagnósticos médicos. Consulta a un dermatólogo para problemas específicos.
        </p>
      </article>
    </div>
  )
}
