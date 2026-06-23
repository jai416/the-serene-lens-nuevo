"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
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
  Flower2,
  History,
  Package,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { SeasonalHero } from "@/components/seasonal-hero"

const FAQSection = dynamic(() => import("@/components/faq-section").then((m) => ({ default: m.FAQSection })), {
  loading: () => <div className="py-16 text-center text-muted-foreground text-sm">Cargando...</div>,
})

const SkinTest = dynamic(() => import("@/components/skin-test").then((m) => ({ default: m.SkinTest })), {
  loading: () => <div className="py-8 text-center text-muted-foreground text-sm">Cargando test...</div>,
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
      {/* ─── Hero ─── */}
      <section className="relative min-h-[90vh] flex items-center py-20 px-4 sm:px-8 overflow-hidden bg-gradient-to-b from-[#ECFFD3] via-[#F8FAF5] to-[#F8FAF5] dark:from-[#1E251C] dark:via-[#222920] dark:to-[#1A1F19]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in-up max-w-xl">
              <SeasonalHero />
              <span className="inline-block bg-[#FFF6AD] dark:bg-[#3A3A24] text-[#2F3A2D] dark:text-[#E8EDE6] px-4 py-1.5 rounded-full text-sm font-medium mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-2 inline" />
                Observación cosmética con IA
              </span>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.08] mb-6 text-[#2F3A2D] dark:text-[#E8EDE6]">
                Conoce mejor
                <br />
                tu piel
              </h1>

              <p className="text-base sm:text-lg text-[#64705E] dark:text-[#9BAA93] leading-relaxed mb-10 max-w-lg">
                Obtén observaciones cosméticas personalizadas mediante fotografías y seguimiento continuo.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={session ? "/analysis" : "/login"}>
                  <button className="inline-flex items-center justify-center text-base font-semibold transition-all bg-[#C2E09D] text-[#2F3A2D] px-8 py-6 rounded-full shadow-[0_4px_16px_rgba(194,224,157,0.35)] hover:shadow-[0_8px_24px_rgba(194,224,157,0.5)] hover:bg-[#B0D48E]">
                    <Scan className="w-4 h-4 mr-2" />
                    Comenzar Análisis
                  </button>
                </Link>
                <Link href="#how-it-works">
                  <button className="inline-flex items-center justify-center text-base font-semibold transition-all bg-white dark:bg-[#2A3228] text-[#2F3A2D] dark:text-[#E8EDE6] px-8 py-6 rounded-full border border-[#C2E09D] dark:border-[#3A5A2A] hover:bg-[#F8FAF5] dark:hover:bg-[#2E3829]">
                    Ver cómo funciona
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </Link>
              </div>

              <p className="text-xs text-[#8A9A82] dark:text-[#7A8A72] mt-4">
                Sin tarjeta de crédito · Resultados en segundos · Privacidad garantizada
              </p>
            </div>

            {/* ─── Right: Elegant natural illustration ─── */}
            <div className="hidden lg:flex items-center justify-center animate-fade-in relative" style={{ animationDelay: "300ms" }}>
              <div className="relative w-full max-w-[420px] aspect-[4/5]">
                {/* Background organic shapes */}
                <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-[#ECFFD3]/60" />
                <div className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full bg-[#FFF6AD]/50" />
                <div className="absolute top-1/2 -left-10 w-20 h-20 rounded-full bg-[#C2E09D]/30" />

                {/* Decorative leaves */}
                <svg className="absolute -top-4 -left-4 w-16 h-16 text-[#C2E09D]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C12 2 8 6 8 10C8 13.3 10.7 16 14 16C17.3 16 20 13.3 20 10C20 6 16 4 12 2Z" />
                  <path d="M12 2C12 2 16 6 16 10C16 13.3 13.3 16 10 16C6.7 16 4 13.3 4 10C4 6 8 4 12 2Z" />
                </svg>
                <svg className="absolute bottom-8 -right-6 w-14 h-14 text-[#ECFFD3]/70 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C12 2 8 6 8 10C8 13.3 10.7 16 14 16C17.3 16 20 13.3 20 10C20 6 16 4 12 2Z" />
                  <path d="M12 2C12 2 16 6 16 10C16 13.3 13.3 16 10 16C6.7 16 4 13.3 4 10C4 6 8 4 12 2Z" />
                </svg>

                {/* Main card with face illustration */}
                <div className="relative w-full h-full rounded-[32px] bg-white dark:bg-[#222920] border border-[#DDE7D3] dark:border-[#3A4536] shadow-[0_4px_20px_rgba(47,58,45,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-8 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-[#F8FAF5] dark:bg-[#2A3228] flex items-center justify-center mb-6 border-2 border-[#ECFFD3] dark:border-[#3A5A2A]">
                    <Flower2 className="w-12 h-12 text-[#C2E09D]" />
                  </div>

                  <h3 className="font-serif text-xl font-semibold text-[#2F3A2D] dark:text-[#E8EDE6] mb-2 text-center">
                    Piel saludable y natural
                  </h3>
                  <p className="text-sm text-[#64705E] dark:text-[#9BAA93] text-center leading-relaxed max-w-xs">
                    Observaciones cosméticas honestas basadas en tus fotografías. Sin diagnósticos, sin porcentajes inventados.
                  </p>

                  {/* Natural decorative elements */}
                  <div className="flex items-center gap-3 mt-6">
                    <div className="w-8 h-8 rounded-full bg-[#ECFFD3] dark:bg-[#2A3A24] flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-[#2F3A2D] dark:text-[#E8EDE6]" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#FFF6AD] dark:bg-[#3A3A24] flex items-center justify-center">
                      <Flower2 className="w-4 h-4 text-[#2F3A2D] dark:text-[#E8EDE6]" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#C2E09D] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#2F3A2D]" />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#8A9A82] dark:text-[#7A8A72]">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C2E09D]" />
                      Privado
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C2E09D]" />
                      Seguro
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C2E09D]" />
                      Educativo
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
                  className="p-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(47,58,45,0.1)] hover:-translate-y-1 cursor-pointer animate-fade-in-up h-full border-t-4 border-t-[#C2E09D]"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFFD3] flex items-center justify-center mb-4">
                      <card.icon className="w-5 h-5 text-[#2F3A2D]" />
                    </div>
                    <h3 className="font-serif text-base font-semibold text-[#2F3A2D] mb-1">{card.title}</h3>
                    <p className="text-xs text-[#64705E] leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-8 bg-[#F8FAF5] dark:bg-[#1E251C]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
              Proceso Simple
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6]">
              ¿Cómo Funciona?
            </h2>
            <p className="text-[#64705E] dark:text-[#9BAA93]">Tres pasos sencillos para conocer tu piel.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, i) => (
              <Card
                key={step.title}
                className="p-8 text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <CardContent className="p-0">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5">
                    <step.icon className="w-6 h-6 text-[#2F3A2D]" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-3 text-[#2F3A2D] dark:text-[#E8EDE6]">{step.title}</h3>
                  <p className="text-sm text-[#64705E] dark:text-[#9BAA93] leading-relaxed">{step.description}</p>
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
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6]">
              Sin Engaños
            </h2>
            <p className="text-[#64705E] dark:text-[#9BAA93]">Lo que ves es lo que obtienes. Sin métricas inventadas.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={f.title} className="p-6 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-0">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-[#2F3A2D]" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold mb-2 text-[#2F3A2D] dark:text-[#E8EDE6]">{f.title}</h3>
                  <p className="text-sm text-[#64705E] dark:text-[#9BAA93]">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Quick Skin Test ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-[#F8FAF5] dark:bg-[#1E251C]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
              Mini Test
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6]">
              ¿Qué tipo de piel tienes?
            </h2>
            <p className="text-[#64705E] dark:text-[#9BAA93]">Responde 3 preguntas rápidas y descúbrelo.</p>
          </div>
          <SkinTest />
        </div>
      </section>

      {/* ─── Pricing Preview ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 bg-[#F8FAF5] dark:bg-[#1E251C]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-[#2F3A2D] dark:text-[#E8EDE6]">
              Un Plan para Cada Objetivo
            </h2>
            <p className="text-[#64705E] dark:text-[#9BAA93]">Sin letra pequeña. Sin sorpresas.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                name: "Essential",
                price: "$0",
                badge: "Para empezar",
                features: ["1 observación cosmética", "Rutina personalizada", "Blog y guías"],
              },
              {
                name: "Premium",
                price: "$4.99",
                badge: "Popular",
                popular: true,
                features: ["Análisis ilimitados", "Historial completo", "Rutinas mañana + noche", "Escáner de productos"],
              },
              {
                name: "Pro",
                price: "$9.99",
                badge: "Recomendado",
                features: ["Todo lo de Premium", "Prioridad en análisis", "Soporte prioritario", "Acceso anticipado"],
              },
            ].map((p, i) => (
              <Card
                key={p.name}
                className={`p-8 flex flex-col transition-all duration-300 animate-fade-in-up ${
                  p.popular ? "sm:scale-[1.04] z-10 ring-2 ring-[#C2E09D]" : ""
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="p-0 flex flex-col h-full">
                  {p.popular && (
                    <div className="mb-4">
                      <Badge variant="primary" className="rounded-full px-4 py-1 text-xs font-bold">
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
                    <p className="text-lg font-semibold mb-1 text-[#2F3A2D] dark:text-[#E8EDE6]">{p.name}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`font-bold text-[#2F3A2D] dark:text-[#E8EDE6] ${p.popular ? "text-3xl" : "text-2xl"}`}>{p.price}</span>
                      {p.price !== "$0" && <span className="text-sm text-[#64705E] dark:text-[#9BAA93]">/mes</span>}
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[#64705E] dark:text-[#9BAA93]">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#C2E09D]" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/pricing" className="w-full mt-auto">
                    <Button
                      variant={p.popular ? "primary" : "secondary"}
                      className="w-full py-5 h-auto"
                    >
                      {p.popular ? "Empezar con Premium" : p.name === "Essential" ? "Comenzar Gratis" : "Elegir Pro"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FAQSection />

      {/* ─── Disclaimer ─── */}
      <section className="pb-20 text-center px-4">
        <p className="text-xs text-[#8A9A82] dark:text-[#7A8A72] max-w-lg mx-auto leading-relaxed">
          Esta herramienta ofrece observaciones cosméticas orientativas basadas únicamente en fotografías proporcionadas por el usuario. No constituye diagnóstico médico ni reemplaza la evaluación de un dermatólogo.
        </p>
      </section>
    </div>
  )
}
