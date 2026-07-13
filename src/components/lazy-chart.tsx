"use client"

import dynamic from "next/dynamic"

const EvolutionChart = dynamic(
  () => import("@/components/evolution-chart").then((m) => ({ default: m.EvolutionChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-[#F8F9FA] animate-pulse rounded-xl border border-[#E8E8E8]" />
    ),
  }
)

export { EvolutionChart }
