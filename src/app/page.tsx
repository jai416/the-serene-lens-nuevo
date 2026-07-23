"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Scan,
  Sparkles,
  Eye,
  Beaker,
  Trophy,
  CheckCircle2,
  Leaf,
  Shield,
  ArrowRight,
  History,
  Package,
  Timer,
  Lock,
  Star,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { SeasonalHero } from "@/components/seasonal-hero"
import { CardSkeleton } from "@/components/ui/skeleton"

const FAQSection = dynamic(() => import("@/components/faq-section").then((m) => ({ default: m.FAQSection })), {
  loading: () => <CardSkeleton />,
})

const steps = [
  { icon: Eye, title: "Sube tus fotos", description: "Captura tu rostro desde varios ángulos. Sin filtros, sin maquillaje." },
  { icon: Beaker, title: "Observamos tu piel", description: "Analizamos textura, poros, brillo y más. Sin porcentajes, solo observaciones reales." },
  { icon: Trophy, title: "Recibe tu rutina", description: "Obtén una rutina personalizada mañana/noche con recomendaciones honestas." },
]

const features = [
  { icon: Scan, title: "Análisis Visual Descriptivo", description: "Categorías como 'textura uniforme' o 'grasa aparente baja'. Nunca porcentajes inventados." },
  { icon: Leaf, title: "Recomendaciones Reales", description: "Basadas en tu tipo de piel, preocupaciones y rutina actual." },
  { icon: Shield, title: "Sin Diagnósticos Médicos", description: "Somos una herramienta informativa. Consulta siempre a un profesional." },
]

const actionCards = [
  { icon: Scan, title: "Análisis de piel", description: "Observaciones cosméticas personalizadas con fotografías.", href: "/analysis" },
  { icon: History, title: "Historial", description: "Revisa tus análisis anteriores y sigue tu evolución.", href: "/dashboard/history" },
  { icon: Leaf, title: "Rutinas", description: "Rutinas mañana y noche adaptadas a tu piel.", href: "/dashboard/history" },
  { icon: Beaker, title: "Ingredientes", description: "Escanea y conoce los ingredientes de tus productos.", href: "/products" },
]

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                name: "The Serene Lens",
                url: process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/blog?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                name: "The Serene Lens",
                url: process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com",
                logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"}/logo.webp`,
                description: "Observación cosmética de tu piel con inteligencia artificial.",
              },
            ],
          }),
        }}
      />
      {/* ─── Hero ─── */}
      <section className="relative min-h-[90vh] flex items-center py-20 px-4 sm:px-8 overflow-hidden bg-gradient-to-b from-[#F8F9FA] via-[#F8F9FA] to-white">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in-up max-w-xl">
              <SeasonalHero />
              <span className="inline-block bg-[#88B078] text-[#1A1A1A] px-4 py-1.5 rounded-full text-sm font-medium mb-4 shadow-md">
                <Sparkles className="w-3.5 h-3.5 mr-2 inline" />
                Análisis cosmético con IA
              </span>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.08] mb-6 text-[#1A1A1A]">
                Descubre lo que tu
                <br />
                piel necesita
              </h1>

              <p className="text-base sm:text-lg text-[#666666] leading-relaxed mb-6 max-w-lg">
                Sube una selfie y recibe un análisis personalizado con IA en segundos. Sin esperas, sin agendas.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={session ? "/analysis" : "/login"}>
                  <button className="inline-flex items-center justify-center text-base font-semibold transition-all bg-[#88B078] text-white px-8 py-6 rounded-full shadow-[0_4px_16px_rgba(136,176,120,0.25)] hover:shadow-[0_8px_24px_rgba(136,176,120,0.35)] hover:bg-[#6F9A5E]">
                    <Scan className="w-4 h-4 mr-2" />
                    Comenzar Análisis
                  </button>
                </Link>
                <Link href="#how-it-works">
                  <button className="inline-flex items-center justify-center text-base font-semibold transition-all bg-white text-[#1A1A1A] px-8 py-6 rounded-full border-2 border-[#E8E8E8] hover:bg-[#F8F9FA]">
                    Ver cómo funciona
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <Timer className="w-3.5 h-3.5 text-[#88B078]" />
                  Análisis en menos de 30 segundos
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <Shield className="w-3.5 h-3.5 text-[#88B078]" />
                  Privacidad protegida
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#88B078]" />
                  Sin tarjeta de crédito
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                  <Star className="w-3.5 h-3.5 text-[#88B078]" />
                  Recomendaciones personalizadas
                </div>
              </div>
            </div>

            {/* ─── Right: Hero Image ─── */}
            <div className="hidden lg:flex items-center justify-center animate-fade-in relative" style={{ animationDelay: "300ms" }}>
              <div className="relative w-full max-w-[420px] aspect-[4/5]">
                <Image
                  src="/images/hero-skincare.webp"
                  alt="The Serene Lens — Análisis de piel con IA"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover rounded-[32px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-8 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
              Proceso Simple
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-[#1A1A1A]">
              ¿Cómo Funciona?
            </h2>
            <p className="text-[#666666]">Tres pasos sencillos para conocer tu piel.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, i) => (
              <Card
                key={step.title}
                className="p-8 text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <CardContent className="p-0">
                  <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] flex items-center justify-center mx-auto mb-5">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-3 text-[#1A1A1A]">{step.title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
              <Leaf className="w-3.5 h-3.5 mr-2" />
              Transparencia
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-[#1A1A1A]">
              Sin Engaños
            </h2>
            <p className="text-[#666666]">Lo que ves es lo que obtienes. Sin métricas inventadas.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={f.title} className="p-6 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-0">
                  <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold mb-2 text-[#1A1A1A]">{f.title}</h3>
                  <p className="text-sm text-[#666666]">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Action Cards ─── */}
      <section className="px-4 sm:px-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {actionCards.map((card, i) => (
              <Link key={card.title} href={card.href}>
                <Card
                  className="p-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(61,50,41,0.1)] hover:-translate-y-1 cursor-pointer animate-fade-in-up h-full border-t-4 border-t-[#1A1A1A]"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="w-10 h-10 rounded-xl bg-[#88B078] flex items-center justify-center mb-4">
                      <card.icon className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <h3 className="font-serif text-base font-semibold text-[#1A1A1A] mb-1">{card.title}</h3>
                    <p className="text-xs text-[#666666] leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Preview ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-[#1A1A1A]">
              Un Plan para Cada Objetivo
            </h2>
            <p className="text-[#666666]">Sin letra pequeña. Sin sorpresas.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                id: "FREE",
                name: "Essential",
                price: "$0",
                period: "",
                badge: "Para empezar",
                popular: false,
                features: ["1 análisis de piel con IA", "Rutina personalizada", "Blog y guías educativas"],
              },
              {
                id: "PREMIUM",
                name: "Premium",
                price: "$7.99",
                period: "/mes",
                badge: "Popular",
                popular: true,
                features: ["Análisis ilimitados", "Historial completo", "Comparación de evolución", "Seguimiento avanzado"],
              },
              {
                id: "PRO",
                name: "Pro",
                price: "$14.99",
                period: "/mes",
                badge: "Recomendado",
                popular: false,
                features: ["Todo Premium", "Procesamiento prioritario", "Acceso temprano a funciones", "Soporte prioritario"],
              },
              {
                id: "ESTHETICIAN",
                name: "Esteticista",
                price: "$49.99",
                period: "/mes",
                badge: "Profesional",
                popular: false,
                features: ["Análisis ilimitados", "Dashboard multiusuario", "QR de referido", "Soporte prioritario 24/7", "Estadísticas de clientes"],
              },
            ].map((p, i) => (
              <Card
                key={p.id}
                className={`p-8 flex flex-col transition-all duration-300 animate-fade-in-up ${
                   p.popular ? "sm:scale-[1.04] z-10 ring-2 ring-[#1A1A1A]" : ""
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="p-0 flex flex-col h-full">
                  {p.popular && (
                    <div className="mb-4">
                      <Badge variant="mint" className="rounded-full px-4 py-1 text-xs font-bold">
                        {p.badge}
                      </Badge>
                    </div>
                  )}
                  {!p.popular && (
                    <div className="mb-4">
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                        {p.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <p className="text-lg font-semibold mb-1 text-[#1A1A1A]">{p.name}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`font-bold text-[#1A1A1A] ${p.popular ? "text-3xl" : "text-2xl"}`}>{p.price}</span>
                      {p.period && <span className="text-sm text-[#666666]">{p.period}</span>}
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[#666666]">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#1A1A1A]" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/pricing" className="w-full mt-auto">
                    <Button
                      variant={p.popular ? "primary" : "secondary"}
                      className="w-full py-5 h-auto"
                    >
                      {p.popular ? "Empezar con Premium" : p.id === "FREE" ? "Comenzar Gratis" : p.id === "ESTHETICIAN" ? "Elegir Esteticista" : "Elegir Pro"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            <p className="col-span-full text-center text-xs text-[#666666] mt-4">
              Planes anuales (Premium $79.99/año) y Esteticista ($499.99/año) disponibles.
            </p>
          </div>
        </div>
      </section>

      <FAQSection />

      {/* ─── Disclaimer ─── */}
      <section className="pb-20 text-center px-4">
        <p className="text-xs text-[#9BAA93] max-w-lg mx-auto leading-relaxed">
          Esta herramienta ofrece observaciones cosméticas orientativas basadas únicamente en fotografías proporcionadas por el usuario. No constituye diagnóstico médico ni reemplaza la evaluación de un dermatólogo.
        </p>
      </section>

      <footer className="border-t border-[#E8E8E8] py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#666666]">
          <Link href="/privacy">Políticas de Privacidad</Link>
          <Link href="/terms">Términos de Servicio</Link>
          <Link href="/payment-policy">Política de Pagos</Link>
          <Link href="/contact">Contacto</Link>
          <Link href="/about">Sobre Nosotros</Link>
        </div>
      </footer>
    </div>
  )
}
