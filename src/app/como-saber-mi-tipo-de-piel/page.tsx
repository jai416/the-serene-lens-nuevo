import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Cómo Saber Mi Tipo de Piel - Guía Gratis | The Serene Lens",
  description: "Descubre cómo identificar tu tipo de piel con una guía completa y un análisis de IA gratuito. Grasa, seca, mixta, normal o sensible.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/como-saber-mi-tipo-de-piel` },
  openGraph: {
    title: "Cómo Saber Mi Tipo de Piel",
    description: "Guía completa para identificar tu tipo de piel. Análisis gratuito con inteligencia artificial.",
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/como-saber-mi-tipo-de-piel`,
  },
}

export default function ComoSaberMiTipoDePielPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <article className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
          Cómo Saber Mi Tipo de Piel
        </h1>
        <p className="text-lg text-[#666666] mb-8 leading-relaxed">
          Conocer tu tipo de piel es el primer paso para elegir los productos correctos.
          En esta guía te explicamos cómo identificarlo y por qué es tan importante.
        </p>

        <div className="prose prose-lg max-w-none space-y-6 text-[#1A1A1A]">
          <h2 className="text-xl font-semibold">¿Por qué es importante saber tu tipo de piel?</h2>
          <p className="text-[#666666] leading-relaxed">
            Cada tipo de piel tiene necesidades diferentes. Usar productos inadecuados puede empeorar problemas como acné, sequedad o sensibilidad. Cuando conoces tu tipo de piel, puedes elegir productos que realmente funcionen para ti.
          </p>

          <h2 className="text-xl font-semibold">Los 5 tipos de piel</h2>
          <div className="space-y-3 not-prose">
            {[
              { title: "Piel grasa", desc: "Brillo excesivo, poros visibles, propensa al acné. Necesita productos oil-free y no comedogénicos." },
              { title: "Piel seca", desc: "Tensión, descamación, textura irregular. Necesita hidratación intensa y protección." },
              { title: "Piel mixta", desc: "Zona T grasa, mejillas normales o secas. Necesita tratamientos diferenciados por zona." },
              { title: "Piel normal", desc: "Equilibrada, pocos problemas visibles. Mantenimiento básico con limpieza e hidratación." },
              { title: "Piel sensible", desc: "Reacciones frecuentes, enrojecimiento, irritación. Productos hipoalergénicos y sin fragancia." },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[#1A1A1A]">{item.title}</h3>
                  <p className="text-sm text-[#666666]">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-xl font-semibold">¿Cómo identificar tu tipo de piel?</h2>
          <p className="text-[#666666] leading-relaxed">
            Puedes hacer el famoso &quot;test del papel&quot; o simplemente observar tu piel por la mañana. Pero la forma más precisa es usar una herramienta de análisis con inteligencia artificial que observa tu piel directamente.
          </p>

          <Card className="bg-[#88B078]/20 border-[#88B078]">
            <CardContent className="p-6 text-center">
              <p className="text-[#1A1A1A] font-semibold mb-2">
                ¿Quieres saber tu tipo de piel exacto?
              </p>
              <p className="text-sm text-[#666666] mb-4">
                Usa The Serene Lens, nuestra herramienta gratuita que analiza tu piel con IA y te recomienda productos personalizados.
              </p>
              <Link
                href="/analysis"
                className={buttonVariants({ variant: "primary" })}
              >
                Analizar mi piel gratis →
              </Link>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-[#999999] mt-8">
          Esta herramienta ofrece observaciones cosméticas orientativas, no diagnósticos médicos.
        </p>
      </article>
    </div>
  )
}
