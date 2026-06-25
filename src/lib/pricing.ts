export const FALLBACK_CUP_RATE = Number(process.env.NEXT_PUBLIC_CUP_FALLBACK) || 500

export const PACK_EXPIRY_DAYS = 30

function toCUP(usd: number): number {
  return Math.round(usd * FALLBACK_CUP_RATE)
}

export interface PlanDef {
  id: string
  name: string
  priceUSD: number
  priceCUP: number
  period: string
  analysesPerMonth: number
  features: string[]
  popular: boolean
}

export interface PackDef {
  id: string
  name: string
  priceUSD: number
  priceCUP: number
  analyses: number
  features: string[]
  popular: boolean
}

export const PLANS: PlanDef[] = [
  {
    id: "FREE",
    name: "Essential",
    priceUSD: 0,
    priceCUP: 0,
    period: "para siempre",
    analysesPerMonth: 1,
    features: [
      "1 análisis de piel con IA",
      "Rutina personalizada",
      "Blog y guías educativas",
    ],
    popular: false,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    priceUSD: 4.99,
    priceCUP: toCUP(4.99),
    period: "por mes",
    analysesPerMonth: -1,
    features: [
      "Análisis ilimitados",
      "Historial completo",
      "Comparación de evolución",
      "Seguimiento avanzado",
      "Escaneos adicionales",
    ],
    popular: true,
  },
  {
    id: "PRO",
    name: "Pro",
    priceUSD: 9.99,
    priceCUP: toCUP(9.99),
    period: "por mes",
    analysesPerMonth: -1,
    features: [
      "Todo Premium",
      "Procesamiento prioritario",
      "Acceso temprano a nuevas funciones",
      "Herramientas avanzadas",
      "Soporte prioritario",
    ],
    popular: false,
  },
  {
    id: "PRO_PLUS",
    name: "Pro+",
    priceUSD: 14.99,
    priceCUP: toCUP(14.99),
    period: "por mes",
    analysesPerMonth: -1,
    features: [
      "Todo Pro",
      "Comparativa mensual automática",
      "Rutina dinámica semanal",
      "Informe PDF descargable",
      "Soporte prioritario (1 hora)",
    ],
    popular: false,
  },
]

export const PACKS: PackDef[] = [
  {
    id: "BASIC",
    name: "Pack Básico",
    priceUSD: 1.99,
    priceCUP: toCUP(1.99),
    analyses: 3,
    features: [
      "3 análisis de piel",
      "Historial desbloqueado",
      "Válido por 30 días",
    ],
    popular: false,
  },
  {
    id: "POPULAR",
    name: "Pack Popular",
    priceUSD: 4.99,
    priceCUP: toCUP(4.99),
    analyses: 5,
    features: [
      "5 análisis de piel",
      "Historial desbloqueado",
      "Comparación de resultados",
      "Válido por 30 días",
    ],
    popular: true,
  },
  {
    id: "ADVANCED",
    name: "Pack Avanzado",
    priceUSD: 6.99,
    priceCUP: toCUP(6.99),
    analyses: 15,
    features: [
      "15 análisis de piel",
      "Historial desbloqueado",
      "Comparación avanzada",
      "Acceso prioritario",
      "Válido por 30 días",
    ],
    popular: false,
  },
]

export function getPlan(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id)
}

export function getPack(id: string): PackDef | undefined {
  return PACKS.find((p) => p.id === id)
}

export function getPlanLabel(id: string): string {
  return getPlan(id)?.name || id
}

export { FALLBACK_CUP_RATE as CUP_RATE }
