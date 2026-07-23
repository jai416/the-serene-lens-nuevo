import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { scanProductIngredients } from "@/lib/product-scanner"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { createHash } from "crypto"
import { db } from "@/lib/db"

const alarmistTerms = [
  "tóxico", "toxina", "veneno", "venenoso", "cancerígeno", "carcinógeno",
  "mortal", "peligroso", "dañino", "nocivo", "letal",
]

function sanitizeSummary(summary: string): string {
  let sanitized = summary
  alarmistTerms.forEach((term) => {
    const regex = new RegExp(term, "gi")
    sanitized = sanitized.replace(regex, (match) => `[${match}]`)
  })
  return sanitized
}

async function getCacheKey(base64: string): Promise<string> {
  const hash = createHash("sha256")
  hash.update(base64.slice(0, 1000))
  return "product_scan:" + hash.digest("hex").slice(0, 32)
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return unauthorized("Inicia sesión para escanear productos")
  }

  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null

    if (!file) return error("Imagen requerida")

    if (file.size > 10 * 1024 * 1024) {
      return error("La imagen no debe superar 10MB")
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Check cache
    const cacheKey = await getCacheKey(base64)
    const cached = await db.cache.findUnique({ where: { key: cacheKey } })
    if (cached && cached.expiresAt > new Date()) {
      const parsed = JSON.parse(cached.value)
      if (parsed.summary) parsed.summary = sanitizeSummary(parsed.summary)
      return ok({ result: parsed, cached: true })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })
    const lastAnalysis = user ? await db.skinAnalysis.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { skinType: true },
    }) : null

    const result = await scanProductIngredients(base64, lastAnalysis?.skinType)

    // Save to cache
    await db.cache.upsert({
      where: { key: cacheKey },
      update: { value: JSON.stringify(result), expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
      create: { key: cacheKey, value: JSON.stringify(result), expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
    }).catch((e) => logger.error("Cache upsert failed", { error: e }))

    if (result.summary) {
      result.summary = sanitizeSummary(result.summary as string)
    }

    return ok({ result, cached: false })
  } catch (e: unknown) {
    logger.error("Product scan error", { error: e, userId: session.user.id })

    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("ETIMEDOUT") || msg.includes("fetch failed")) {
      return error("El servicio de análisis está temporalmente no disponible. Intenta de nuevo en unos segundos.")
    }

    return serverError(e)
  }
}
