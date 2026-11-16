"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sparkles, Sun, Moon, CheckCircle2, ArrowRight, Lock, History, TrendingUp,
} from "lucide-react"

interface GuestResultData {
  skinType?: string | null
  resumenGeneral?: string
  summary?: string
  observations?: string[]
  recommendations?: string[]
  routine?: { morning?: string[]; evening?: string[] } | null
}

export function GuestResult({ result }: { result: GuestResultData }) {
  const summary = result.resumenGeneral || result.summary || ""
  const observations = (result.observations || []).slice(0, 4)
  const recommendations = (result.recommendations || []).slice(0, 4)
  const morning = result.routine?.morning || []
  const evening = result.routine?.evening || []

  return (
    <div className="space-y-5">
      {/* Resultado */}
      <Card className="p-6 border-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#88B078]" />
            <span className="text-xs font-medium text-[#666666] uppercase tracking-wide">Tu análisis está listo</span>
          </div>

          {result.skinType && (
            <div className="mb-4">
              <Badge className="rounded-full px-3 py-1 border-0 bg-[#E2ECE0] text-[#88B078]">
                {result.skinType}
              </Badge>
            </div>
          )}

          {summary && (
            <p className="text-sm text-[#1A1A1A] leading-relaxed mb-5">{summary}</p>
          )}

          {observations.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Observaciones</h3>
              <ul className="space-y-1.5">
                {observations.map((o, i) => (
                  <li key={i} className="text-sm text-[#666666] flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#88B078] mt-0.5 shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2">Recomendaciones</h3>
              <ul className="space-y-1.5">
                {recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-[#666666] flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#88B078] mt-0.5 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(morning.length > 0 || evening.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {morning.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F8F9FA]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sun className="w-3.5 h-3.5 text-[#D4A574]" />
                    <span className="text-xs font-semibold text-[#1A1A1A]">Rutina de mañana</span>
                  </div>
                  <ol className="space-y-1">
                    {morning.map((step, i) => (
                      <li key={i} className="text-xs text-[#666666]">{i + 1}. {step}</li>
                    ))}
                  </ol>
                </div>
              )}
              {evening.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F8F9FA]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Moon className="w-3.5 h-3.5 text-[#7BA3C4]" />
                    <span className="text-xs font-semibold text-[#1A1A1A]">Rutina de noche</span>
                  </div>
                  <ol className="space-y-1">
                    {evening.map((step, i) => (
                      <li key={i} className="text-xs text-[#666666]">{i + 1}. {step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paywall */}
      <Card className="p-6 border-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-gradient-to-br from-[#E2ECE0] to-[#F8F9FA]">
        <CardContent className="p-0 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#88B078] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">
            Guarda este resultado y desbloquea tu evolución
          </h3>
          <p className="text-sm text-[#666666] mb-5 max-w-md mx-auto">
            Con tu cuenta gratis tienes 3 análisis al mes, historial completo y rutinas guardadas.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <Link href="/register?callbackUrl=/analysis">
              <Button variant="primary" className="px-8 w-full sm:w-auto">
                Crear cuenta gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login?callbackUrl=/analysis">
              <Button variant="secondary" className="px-8 w-full sm:w-auto">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[#666666]">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#88B078]" />
              Historial de análisis
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#88B078]" />
              Gráfico de evolución
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#88B078]" />
              3 análisis al mes
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
