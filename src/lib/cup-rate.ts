import { unstable_cache } from "next/cache"
import { db } from "@/lib/db"
import { FALLBACK_CUP_RATE } from "@/lib/pricing"

export const getCachedCupRate = unstable_cache(
  async (): Promise<number> => {
    try {
      const config = await db.appConfig.findUnique({ where: { key: "cupExchangeRate" } })
      if (config) {
        const rate = Number(config.value)
        if (!isNaN(rate) && rate > 0) return rate
      }
    } catch {
      // DB unavailable, use fallback
    }
    return FALLBACK_CUP_RATE
  },
  ["cup-exchange-rate"],
  { revalidate: 1800, tags: ["app-config"] }
)

export async function getCUPRate(): Promise<number> {
  return getCachedCupRate()
}

export function toCUP(usd: number, rate: number): number {
  return Math.round(usd * rate)
}
