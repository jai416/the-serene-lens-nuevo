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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

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
            Sobre <span className="text-[#C2E09D]">The Serene Lens</span>
          </h1>
        </div>

        <Card className="bg-white border-[#E8DDD0] mb-10">
          <CardContent className="p-6 sm:p-10">
            <div className="prose prose-sm sm:prose-base max-w-none prose-headings:font-serif prose-headings:font-semibold">
              <p className="text-lg text-[#3D3229] leading-relaxed">
                Soy un programador que se hartó de apps de skincare que inventaban
                porcentajes.
              </p>
              <p className="text-[#8A7A6A] leading-relaxed">
                Cada día aparecían nuevas aplicaciones prometiendo que tu piel tenía
                un &quot;problema&quot; con un porcentaje inventado, solo para venderte
                un producto. Porcentajes que no significaban nada. Diagnósticos que no
                eran reales. Datos que nadie podía verificar.
              </p>
              <p className="text-[#8A7A6A] leading-relaxed">
                Creé <strong className="text-[#3D3229]">The Serene Lens</strong> para
                ser honesto: observación cosmética, sin diagnósticos falsos. Una
                herramienta que te dice lo que realmente puede observarse en tu piel a
                través de fotos, con recomendaciones educativas, no comerciales.
              </p>
              <p className="text-[#8A7A6A] leading-relaxed">
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
                className="bg-white border-[#E8DDD0] text-center"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8D5C4]/20 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-5 h-5 text-[#3D3229]" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold mb-2 text-[#3D3229]">
                    {value.title}
                  </h3>
                  <p className="text-sm text-[#8A7A6A]">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-[#E8D5C4]/10 border-[#E8D5C4]">
          <CardContent className="p-6 sm:p-10 text-center">
            <Sparkles className="w-8 h-8 text-[#3D3229] mx-auto mb-4" />
            <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-3 text-[#3D3229]">
              Prueba el análisis
            </h2>
            <p className="text-sm text-[#8A7A6A] max-w-lg mx-auto mb-6">
              Sube una foto de tu piel y recibe observaciones cosméticas honestas.
              Sin compromisos, sin porcentajes inventados.
            </p>
            <Link href="/analysis">
              <Button className="rounded-full bg-[#E8D5C4] hover:bg-[#B0D48E] text-[#3D3229] font-medium">
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
