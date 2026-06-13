"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
} from "lucide-react"
import { useSession } from "next-auth/react"

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

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[90vh] flex items-center py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="glass-card p-8 sm:p-10 lg:p-12 animate-fade-in-up">
              <Badge variant="neon" className="mb-6 rounded-full px-4 py-1.5 text-sm border-0">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Observación Cosmética Visual
              </Badge>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.08] mb-6">
                Deja de Adivinar.
                <br />
                <span className="gradient-text">Conoce Tu Piel.</span>
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed mb-8 max-w-lg">
                Manchas, piel grasa, arrugas, textura irregular… observamos tu rostro y creamos
                una rutina precisa para ti. Sin porcentajes, sin inventos.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={session ? "/analysis" : "/api/auth/signin"}>
                  <Button variant="neon" size="lg" className="text-base px-8 py-6 h-auto">
                    <Scan className="w-4 h-4 mr-2" />
                    Observa tu Piel — Gratis
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="glass" size="lg" className="text-base px-8 py-6 h-auto">
                    Ver Planes
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground/80 mt-4">
                Sin tarjeta de crédito · Resultados en segundos · Privacidad garantizada
              </p>
            </div>

            <div className="hidden lg:flex items-center justify-center animate-fade-in" style={{ animationDelay: "300ms" }}>
              <div className="glass-card-strong w-[360px] h-[360px] xl:w-[420px] xl:h-[420px] flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-[24px] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                </div>
                <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center neon-glow-strong animate-neon-pulse">
                  <Scan className="w-16 h-16 text-primary-foreground" />
                </div>
                <div className="absolute w-[260px] h-[260px] xl:w-[320px] xl:h-[320px] rounded-full border border-[rgba(183,255,42,0.15)] animate-spin-slow pointer-events-none" />
                <div className="absolute w-[200px] h-[200px] xl:w-[250px] xl:h-[250px] rounded-full border border-[rgba(183,255,42,0.08)] animate-spin-slow pointer-events-none" style={{ animationDirection: "reverse", animationDuration: "12s" }} />
                <div className="absolute w-2 h-2 rounded-full bg-primary neon-glow" style={{ top: "15%", left: "50%" }} />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-primary/60" style={{ bottom: "20%", right: "18%" }} />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-primary/60" style={{ bottom: "25%", left: "15%" }} />
                <div className="absolute w-1 h-1 rounded-full bg-primary/40" style={{ top: "35%", right: "12%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              Proceso Simple
            </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">
                ¿Cómo <span className="gradient-text">Funciona</span>?
              </h2>
              <p className="text-on-surface-variant">Tres pasos sencillos para conocer tu piel.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="glass-card p-8 text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 shadow-md neon-glow">
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
              <Leaf className="w-3.5 h-3.5 mr-2" />
              Transparencia
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">
              Sin <span className="gradient-text">Engaños</span>
            </h2>
            <p className="text-on-surface-variant">Lo que ves es lo que obtienes. Sin métricas inventadas.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={f.title} className="p-6 animate-fade-in-up border-[rgba(255,255,255,0.25)]" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-0">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 neon-glow">
                    <f.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-on-surface-variant">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Preview ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">
              Un Plan para Cada <span className="gradient-text">Objetivo</span>
            </h2>
            <p className="text-on-surface-variant">Sin letra pequeña. Sin sorpresas.</p>
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
              <div
                key={p.name}
                className={`relative glass-card p-8 flex flex-col transition-all duration-300 animate-fade-in-up ${
                  p.popular ? "scale-[1.02] sm:scale-[1.04] z-10 neon-border" : ""
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="neon" className="border-0 rounded-full px-4 py-1 text-xs font-bold">
                      {p.badge}
                    </Badge>
                  </div>
                )}
                {!p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                      {p.badge}
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6 mt-1">
                  <p className="text-lg font-semibold mb-1">{p.name}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`font-bold text-on-surface ${p.popular ? "text-3xl" : "text-2xl"}`}>{p.price}</span>
                    {p.price !== "$0" && <span className="text-sm text-muted-foreground">/mes</span>}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/pricing" className="w-full">
                  <Button
                    variant={p.popular ? "neon" : "glass"}
                    className="w-full py-5 h-auto"
                  >
                    {p.popular ? "Empezar con Premium" : p.name === "Essential" ? "Comenzar Gratis" : "Elegir Pro"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5">
              Preguntas Frecuentes
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">
              ¿Tienes <span className="gradient-text">Dudas</span>?
            </h2>
          </div>

          <Card className="border-[rgba(255,255,255,0.25)] overflow-hidden">
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                <AccordionItem value="1">
                  <AccordionTrigger className="px-6 py-4 text-sm font-medium">
                    ¿Cómo funciona la observación cosmética?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-sm text-on-surface-variant">
                    Nuestra IA analiza tus fotos y detecta patrones visuales como textura, poros, brillo y más.
                    Te damos observaciones descriptivas honestas, no porcentajes inventados.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="2">
                  <AccordionTrigger className="px-6 py-4 text-sm font-medium">
                    ¿Esto reemplaza una consulta profesional?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-sm text-on-surface-variant">
                    No. Somos una herramienta educativa e informativa. Siempre consulta a un profesional de la salud
                    para cualquier preocupación sobre tu piel.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="3">
                  <AccordionTrigger className="px-6 py-4 text-sm font-medium">
                    ¿Puedo cancelar mi suscripción?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-sm text-on-surface-variant">
                    Sí, en cualquier momento desde tu dashboard. Sin penalizaciones.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="4">
                  <AccordionTrigger className="px-6 py-4 text-sm font-medium">
                    ¿Mis datos están seguros?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-sm text-on-surface-variant">
                    Usamos cifrado y mejores prácticas. Tus fotos nunca se comparten con terceros.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── Disclaimer ─── */}
      <section className="pb-20 text-center px-4">
        <p className="text-xs text-muted-foreground max-w-lg mx-auto">
          Los resultados del análisis son informativos y no constituyen un diagnóstico médico.
          Consulta siempre a un profesional de la salud para cualquier preocupación sobre tu piel.
        </p>
      </section>
    </div>
  )
}
