import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Test de Tipo de Piel Gratis con IA | The Serene Lens",
  description: "Descubre tu tipo de piel (grasa, seca, mixta, normal, sensible) con un análisis de IA gratuito. Solo sube una foto.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/test-tipo-de-piel` },
  openGraph: {
    title: "Test de Tipo de Piel Gratis",
    description: "¿Tienes piel grasa, seca o mixta? Nuestra IA analiza tu piel y te dice tu tipo exacto.",
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/test-tipo-de-piel`,
  },
}

export default function TestTipoDePielPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full text-center border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="w-16 h-16 bg-[#E2ECE0] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔬</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
            ¿Cuál es tu tipo de piel?
          </h1>
          <p className="text-lg text-[#666666] mb-8 leading-relaxed">
            ¿Piel grasa? ¿Piel seca? ¿Piel mixta? Descúbrelo con un análisis de inteligencia artificial que observa tu piel directamente.
          </p>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">Tipos de piel que analizamos</h2>
              <div className="grid grid-cols-1 gap-2 text-left text-sm text-[#666666]">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FA]">
                  <span className="w-2 h-2 bg-[#88B078] rounded-full" />
                  <span><strong>Piel grasa</strong> — Brillo excesivo, poros visibles</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FA]">
                  <span className="w-2 h-2 bg-[#E2ECE0] rounded-full" />
                  <span><strong>Piel seca</strong> — Tensión, descamación, textura irregular</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FA]">
                  <span className="w-2 h-2 bg-[#FFF9E6] rounded-full" />
                  <span><strong>Piel mixta</strong> — Zona T grasa, mejillas secas</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FA]">
                  <span className="w-2 h-2 bg-[#88B078] rounded-full" />
                  <span><strong>Piel normal</strong> — Equilibrada, pocos problemas</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FA]">
                  <span className="w-2 h-2 bg-[#E2ECE0] rounded-full" />
                  <span><strong>Piel sensible</strong> — Reacciones frecuentes, enrojecimiento</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Link
            href="/analysis"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Hacer mi test ahora →
          </Link>
          <Badge variant="mint" className="mt-6 text-xs block w-fit mx-auto">
            Análisis cosmético, no diagnóstico médico. Resultados basados en observación visual.
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
