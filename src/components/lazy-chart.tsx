"use client"

import dynamic from "next/dynamic"

const EvolutionChart = dynamic(
  () => import("@/components/evolution-chart").then((m) => ({ default: m.EvolutionChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-[#F8FAF5] dark:bg-[#1A1F19] animate-pulse rounded-xl border border-[#DDE7D3] dark:border-[#3A4536]" />
    ),
  }
)

export { EvolutionChart }
