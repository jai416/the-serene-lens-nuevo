import { describe, it, expect, vi } from "vitest"

/**
 * Evaluación de PRECISIÓN del collector contra PubMed REAL.
 *
 * No corre en la suite normal (sin red). Activar con:
 *   TRENDS_EVAL=1 npx vitest run src/lib/__tests__/trends-precision.test.ts
 *
 * No escribe en la BD: solo llama a fetchPubmedCandidates + isRelevantPaper
 * y vuelca el resultado para revisión manual.
 */

vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { TOPICS, fetchPubmedCandidates, isRelevantPaper } from "@/lib/trends/collector"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe.runIf(process.env.TRENDS_EVAL === "1")("evaluación de precisión (real, gated)", () => {
  it("recopila candidatos de los 12 temas y clasifica kept/rejected", async () => {
    let totalCandidates = 0
    let totalKept = 0
    const rejectedLines: string[] = []
    const keptLines: string[] = []

    for (const topic of TOPICS) {
      let candidates
      try {
        candidates = await fetchPubmedCandidates(topic)
      } catch (e) {
        console.log(`[EVAL] ${topic.slug}: ERROR ${e instanceof Error ? e.message : e}`)
        await sleep(500)
        continue
      }
      for (const p of candidates) {
        totalCandidates++
        const ok = isRelevantPaper(topic, p.title, p.abstract)
        if (ok) {
          totalKept++
          keptLines.push(`KEEP  | ${topic.slug} | ${p.pmid} | ${p.title}`)
        } else {
          rejectedLines.push(`REJECT| ${topic.slug} | ${p.pmid} | ${p.title}`)
        }
      }
      await sleep(500) // ≤3 req/s con NCBI sin key (2 peticiones por tema)
    }

    console.log("\n================ RESULTADOS KEEPER ================")
    for (const l of keptLines) console.log(l)
    console.log("================ RESULTADOS DESCARTADOS ============")
    for (const l of rejectedLines) console.log(l)
    console.log("====================================================")
    console.log(`CANDIDATOS=${totalCandidates} KEEPER=${totalKept} DESCARTADOS=${totalCandidates - totalKept}`)
    console.log(`PRECISIÓN MUESTRA=${totalCandidates ? ((totalKept / totalCandidates) * 100).toFixed(1) : "n/a"}%`)

    expect(totalCandidates).toBeGreaterThan(0)
  }, 240000)
})
