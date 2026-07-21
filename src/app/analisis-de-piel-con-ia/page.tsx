import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Análisis de Piel con IA - Gratis y en Línea | The Serene Lens",
  description: "Análisis de piel con inteligencia artificial. Sube fotos, responde preguntas y recibe recomendaciones personalizadas. Gratis.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/analisis-de-piel-con-ia` },
  openGraph: {
    title: "Análisis de Piel con IA",
    description: "Análisis cosmético de piel con inteligencia artificial. Gratis y sin registro.",
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/analisis-de-piel-con-ia`,
  },
}

export default function AnalisisDePielConIAPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <article className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
          Análisis de Piel con Inteligencia Artificial
        </h1>
        <p className="text-lg text-[#666666] mb-8 leading-relaxed">
          The Serene Lens utiliza inteligencia artificial para analizar tu piel directamente desde fotos.
          Obtén observaciones cosméticas detalladas y recomendaciones personalizadas.
        </p>

        <div className="prose prose-lg max-w-none space-y-6 text-[#1A1A1A]">
          <h2 className="text-xl font-semibold">¿Qué analiza la IA?</h2>
          <div className="grid grid-cols-2 gap-3 not-prose">
            {["Textura", "Brillo", "Poros", "Uniformidad", "Sensibilidad", "Grasa aparente"].map((item) => (
              <Card key={item}>
                <CardContent className="p-3 text-center">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-xl font-semibold">¿Cómo funciona?</h2>
          <ol className="space-y-2 text-[#666666] list-decimal list-inside">
            <li>Sube 2-4 fotos de tu piel (frontal, perfil izquierdo, perfil derecho, y opcionalmente una zona de interés)</li>
            <li>Responde preguntas sobre tu edad, sexo, clima y preocupaciones</li>
            <li>Nuestra IA analiza tus fotos y genera un informe cosmético personalizado</li>
            <li>Recibe recomendaciones de productos y rutinas adaptadas a tu piel</li>
          </ol>

          <h2 className="text-xl font-semibold">¿Por qué confiar en The Serene Lens?</h2>
          <ul className="space-y-2 text-[#666666]">
            <li>• No inventamos diagnósticos médicos</li>
            <li>• No usamos porcentajes engañosos</li>
            <li>• Nos basamos únicamente en lo que observamos en tus fotos</li>
            <li>• Todo es transparente y explicado</li>
          </ul>

          <Card className="bg-[#88B078]/20 border-[#88B078]">
            <CardContent className="p-6 text-center">
              <p className="text-[#1A1A1A] font-semibold mb-2">
                ¿Listo para conocer tu piel?
              </p>
              <Link
                href="/analysis"
                className={buttonVariants({ variant: "primary" })}
              >
                Comenzar análisis gratuito →
              </Link>
            </CardContent>
          </Card>
        </div>
      </article>
    </div>
  )
}
