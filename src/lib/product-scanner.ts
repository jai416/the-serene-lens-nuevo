import { logger } from "@/lib/logger"
import { createHash } from "crypto"

const GROQ_API_BASE = "https://api.groq.com/openai/v1"
const MODEL = "llama-3.2-11b-vision-preview"

export async function scanProductIngredients(imageBase64: string, skinType?: string | null) {
  const skinContext = skinType
    ? `El usuario tiene piel ${skinType}. Prioriza ingredientes beneficiosos para este tipo de piel y advierte sobre los que pueden ser problemáticos.`
    : ""

  const SYSTEM_PROMPT = `Eres un experto en análisis de productos cosméticos y skincare.
Responde exclusivamente en español.
Examina la imagen de la etiqueta del producto, extrae los ingredientes y analízalos.
${skinContext}
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
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("Servicio de análisis no disponible. Intenta más tarde.")

  const cacheKey = "product_scan:" + createHash("sha256").update(imageBase64.slice(0, 500)).digest("hex").slice(0, 24)
  try {
    const { db } = await import("@/lib/db")
    const cached = await db.cache.findUnique({ where: { key: cacheKey } })
    if (cached && cached.expiresAt > new Date()) {
      return JSON.parse(cached.value)
    }
  } catch {}

  const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analiza esta imagen de producto skincare y devuelve el JSON en el formato especificado." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("No response from AI")

  let parsed: Record<string, unknown>
  try {
    const clean = content.replace(/```json|```/g, "").trim()
    parsed = JSON.parse(clean)
  } catch {
    throw new Error("Invalid AI response. Try again with a clearer photo.")
  }

  try {
    const { db } = await import("@/lib/db")
    await db.cache.upsert({
      where: { key: cacheKey },
      create: { key: cacheKey, value: JSON.stringify(parsed), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      update: { value: JSON.stringify(parsed), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    })
  } catch {}

  return parsed
}
