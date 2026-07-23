import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flower2, Eye, ShieldCheck, Heart, Sparkles, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "Conoce la historia de The Serene Lens: observación cosmética honesta, sin diagnósticos falsos ni porcentajes inventados.",
  openGraph: {
    title: "Sobre nosotros | The Serene Lens",
    description:
      "Observación cosmética honesta, sin diagnósticos falsos ni porcentajes inventados.",
    type: "website",
    siteName: "The Serene Lens",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sobre nosotros | The Serene Lens",
    description:
      "Observación cosmética honesta, sin diagnósticos falsos ni porcentajes inventados.",
  },
}

const values = [
  {
    icon: ShieldCheck,
    title: "Honestidad",
    description:
      "No inventamos porcentajes ni damos diagnósticos médicos. Lo que ves es lo que observamos, sin exagerar.",
  },
  {
    icon: Eye,
    title: "Transparencia",
    description:
      "Explicamos exactamente qué hace la herramienta y qué no. Sin promesas engañosas.",
  },
  {
    icon: Heart,
    title: "Sin falsos porcentajes",
    description:
      "Otras apps inventan datos. Nosotros describimos lo que vemos en tus fotos con lenguaje claro y real.",
  },
]

export default function AboutPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Sobre nosotros — The Serene Lens",
    description:
      "Observación cosmética honesta, sin diagnósticos falsos ni porcentajes inventados.",
    url: `${baseUrl}/about`,
    mainEntity: {
      "@type": "Organization",
      name: "The Serene Lens",
      url: baseUrl,
    },
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
            <Flower2 className="w-3.5 h-3.5 mr-2" />
            Nuestra historia
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">
            Sobre <span className="text-[#88B078]">The Serene Lens</span>
          </h1>
        </div>

        <Card className="bg-white border-[#E8E8E8] mb-10">
          <CardContent className="p-6 sm:p-10">
            <div className="prose prose-sm sm:prose-base max-w-none prose-headings:font-serif prose-headings:font-semibold">
              <p className="text-lg text-[#1A1A1A] leading-relaxed">
                Soy un programador que se hartó de apps de skincare que inventaban
                porcentajes.
              </p>
              <p className="text-[#666666] leading-relaxed">
                Cada día aparecían nuevas aplicaciones prometiendo que tu piel tenía
                un &quot;problema&quot; con un porcentaje inventado, solo para venderte
                un producto. Porcentajes que no significaban nada. Diagnósticos que no
                eran reales. Datos que nadie podía verificar.
              </p>
              <p className="text-[#666666] leading-relaxed">
                Creé <strong className="text-[#1A1A1A]">The Serene Lens</strong> para
                ser honesto: observación cosmética, sin diagnósticos falsos. Una
                herramienta que te dice lo que realmente puede observarse en tu piel a
                través de fotos, con recomendaciones educativas, no comerciales.
              </p>
              <p className="text-[#666666] leading-relaxed">
                Sin porcentajes mágicos. Sin promesas de cura. Sin vender productos
                inventados. Solo observación, honestidad y transparencia.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mb-12">
          <h2 className="font-serif text-2xl font-semibold text-center mb-8">
            Nuestros valores
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {values.map((value) => (
              <Card
                key={value.title}
                className="bg-white border-[#E8E8E8] text-center"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#88B078]/20 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-5 h-5 text-[#1A1A1A]" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold mb-2 text-[#1A1A1A]">
                    {value.title}
                  </h3>
                  <p className="text-sm text-[#666666]">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-[#88B078]/10 border-[#88B078]">
          <CardContent className="p-6 sm:p-10 text-center">
            <Sparkles className="w-8 h-8 text-[#1A1A1A] mx-auto mb-4" />
            <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-3 text-[#1A1A1A]">
              Prueba el análisis
            </h2>
            <p className="text-sm text-[#666666] max-w-lg mx-auto mb-6">
              Sube una foto de tu piel y recibe observaciones cosméticas honestas.
              Sin compromisos, sin porcentajes inventados.
            </p>
            <Link href="/analysis">
              <Button className="rounded-full bg-[#88B078] hover:bg-[#78A068] text-[#1A1A1A] font-medium">
                <Eye className="w-4 h-4 mr-2" />
                Analizar mi piel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
