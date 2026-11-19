import { logger } from "@/lib/logger"
import { createHash } from "crypto"
import { analyzeImage } from "@/lib/vision"

export async function scanProductIngredients(imageBase64: string, skinType?: string | null) {
  const skinContext = skinType
    ? `El usuario tiene piel ${skinType}. Prioriza ingredientes beneficiosos para este tipo de piel y advierte sobre los que pueden ser problemáticos.`
    : ""

  const SYSTEM_PROMPT = `Eres un experto en análisis de productos cosméticos y skincare.
Responde exclusivamente en español.
Examina la imagen de la etiqueta del producto, extrae los ingredientes y analízalos.
${skinContext}

REGLAS:
1. NUNCA inventes ingredientes: lista SOLO los que se lean en la etiqueta. Si la imagen no muestra una etiqueta legible (borrosa, sin texto, otra cosa), devuelve el JSON con "ingredients": [], "summary" explicando que la foto no tiene una etiqueta legible y pide una foto más nítida de la lista de ingredientes.
2. Ordena los ingredientes como aparecen en la etiqueta.
3. good = beneficiosos para su piel; caution = usables con moderación o fotosensibles (ej: retinol, AHAs); avoid = irritantes o mal combinados (ej: alcohol denat en alta posición, fragancias si hay piel sensible).
4. En summary: máximo3 frases, prácticas, sin alarmismo (nunca uses palabras como "tóxico" o "peligroso").

Responde SOLO con JSON en este formato exacto y nada más:

{
  "productName": "nombre del producto",
  "ingredients": ["ingrediente 1", "ingrediente 2"],
  "analysis": {
    "good": ["ingrediente beneficioso 1", "ingrediente beneficioso 2"],
    "caution": ["ingrediente que requiere precaución 1"],
    "avoid": ["ingrediente a evitar 1"]
  },
  "summary": "resumen breve del análisis del producto"
}`

  const cacheKey = "product_scan:" + createHash("sha256").update(imageBase64.slice(0, 500)).digest("hex").slice(0, 24)
  try {
    const { db } = await import("@/lib/db")
    const cached = await db.cache.findUnique({ where: { key: cacheKey } })
    if (cached && cached.expiresAt > new Date()) {
      return JSON.parse(cached.value)
    }
  } catch (e) { logger.error("Cache read failed", { error: e }) }

  try {
    const prompt = "Analiza esta imagen de producto skincare y devuelve el JSON en el formato especificado."
    const parsed = await analyzeImage(imageBase64, prompt, SYSTEM_PROMPT, {
      temperature: 0.2,
      maxTokens: 1024,
    })

    try {
      const { db } = await import("@/lib/db")
      await db.cache.upsert({
        where: { key: cacheKey },
        create: { key: cacheKey, value: JSON.stringify(parsed), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        update: { value: JSON.stringify(parsed), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      })
    } catch (e) { logger.error("Cache upsert failed", { error: e }) }

    return parsed
  } catch (e) {
    logger.error("Product scan failed", { error: e instanceof Error ? e.message : String(e) })
    throw new Error("Error al analizar el producto con IA. Intenta de nuevo.")
  }
}
