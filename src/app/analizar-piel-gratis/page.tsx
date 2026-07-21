import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Análisis de Piel Gratis con IA | The Serene Lens",
  description: "Sube una foto de tu piel y recibe un análisis cosmético personalizado con inteligencia artificial. Gratis y sin registro.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/analizar-piel-gratis` },
  openGraph: {
    title: "Análisis de Piel Gratis con IA",
    description: "Analiza tu piel con inteligencia artificial. Recomendaciones personalizadas, gratis y sin registro.",
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/analizar-piel-gratis`,
  },
}

export default function AnalizarPielGratisPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full text-center border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="w-16 h-16 bg-[#88B078] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🌸</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
            Análisis de Piel Gratis con IA
          </h1>
          <p className="text-lg text-[#666666] mb-8 leading-relaxed">
            Sube una foto de tu piel y recibe un análisis cosmético personalizado con inteligencia artificial.
            Sin porcentajes inventados ni diagnósticos médicos.
          </p>
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">¿Cómo funciona?</h2>
            <div className="space-y-3 text-left text-[#666666] text-sm">
              <div className="flex items-start gap-3">
                <Badge variant="primary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 p-0">1</Badge>
                <p>Sube 2-4 fotos de tu piel (frontal, perfil izquierdo, perfil derecho)</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="primary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 p-0">2</Badge>
                <p>Responde preguntas sobre tu rutina y tipo de piel</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="primary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 p-0">3</Badge>
                <p>Recibe tu análisis cosmético con recomendaciones personalizadas</p>
              </div>
            </div>
          </div>
          <Link
            href="/analysis"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Analizar mi piel ahora →
          </Link>
          <Badge variant="mint" className="mt-6 text-xs block w-fit mx-auto">
            Esta herramienta ofrece observaciones cosméticas orientativas, no diagnósticos médicos.
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
