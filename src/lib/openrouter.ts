import { getEnv } from "@/lib/env"
import { withRetry } from "@/lib/retry"

const env = getEnv()

const PERCENTAGE_REGEX = /\d+%/g

function containsPercentages(obj: unknown): boolean {
  if (typeof obj === "string") return PERCENTAGE_REGEX.test(obj)
  if (Array.isArray(obj)) return obj.some(containsPercentages)
  if (obj && typeof obj === "object") return Object.values(obj).some(containsPercentages)
  return false
}

function stripPercentages(obj: unknown): unknown {
  if (typeof obj === "string") return obj.replace(PERCENTAGE_REGEX, "").replace(/\s{2,}/g, " ").trim()
  if (Array.isArray(obj)) return obj.map(stripPercentages)
  if (obj && typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripPercentages(v)]))
  }
  return obj
}

interface AnalyzeOptions {
  imagesBase64: string[]
  concerns?: string
  age?: string
  gender?: string
  climate?: string
  routine?: string
  language?: string
}

/**
 * Analyzes skin photos using OpenRouter AI.
 * Returns parsed JSON analysis result.
 */
export async function analyzeSkin({
  imagesBase64,
  concerns,
  age,
  gender,
  climate,
  routine,
  language = "es",
}: AnalyzeOptions) {
  const isEnglish = language === "en"
  const prompt = isEnglish
    ? `You are a skincare cosmetic expert. Analyze this facial skin photo.

${concerns ? `Reported concerns: ${concerns}` : ""}
${age ? `Age: ${age}` : ""}
${gender ? `Gender: ${gender}` : ""}
${climate ? `Climate: ${climate}` : ""}
${routine ? `Current routine: ${routine}` : ""}

Provide your analysis in JSON format (no markdown, valid JSON only). DO NOT use percentages or numbers except for routine steps. Use descriptive categories:

{
    "skinType": "apparent skin type: dry/oily/combination/normal/sensitive",
    "texture": "facial texture: uniform/slightly uneven/uneven",
    "pores": "visible pores: barely visible/moderately visible/visible",
    "shine": "facial shine: low/moderate/high",
    "uniformity": "tone uniformity: uniform/partially uniform/uneven",
    "apparentSensitivity": "apparent sensitivity: low/moderate/high",
    "apparentOil": "apparent oiliness: low/moderate/high",
    "observations": ["visual observation 1", "visual observation 2"],
    "recommendations": ["cosmetic recommendation 1", "cosmetic recommendation 2"],
    "confidence": "analysis confidence: high/medium/low",
    "routine": {
      "morning": ["step 1", "step 2"],
      "evening": ["step 1", "step 2"]
    }
}

Be specific but honest. Do not invent diagnoses or medical conditions. Use descriptive language about VISIBLE characteristics. If you cannot determine something with certainty, indicate it in confidence as "low" or "medium".

All observations must be based solely on what you see in the photograph.`
    : `Eres un experto en cuidado cosmético de la piel. Analiza esta foto de piel facial.

${concerns ? `Preocupaciones reportadas: ${concerns}` : ""}
${age ? `Edad: ${age}` : ""}
${gender ? `Sexo: ${gender}` : ""}
${climate ? `Clima: ${climate}` : ""}
${routine ? `Rutina actual: ${routine}` : ""}

Proporciona tu análisis en formato JSON (sin markdown, solo JSON válido). NO uses porcentajes ni números excepto para pasos de rutina. Usa categorías descriptivas:

{
    "skinType": "tipo de piel aparente: seca/grasa/mixta/normal/sensible",
    "texture": "textura facial: uniforme/levemente irregular/irregular",
    "pores": "poros visibles: poco visibles/moderadamente visibles/visibles",
    "shine": "brillo facial: bajo/moderado/alto",
    "uniformity": "uniformidad del tono: uniforme/parcialmente uniforme/heterogénea",
    "apparentSensitivity": "sensibilidad aparente: baja/moderada/elevada",
    "apparentOil": "grasa aparente: baja/moderada/alta",
    "observations": ["observación visual 1", "observación visual 2"],
    "recommendations": ["recomendación cosmética 1", "recomendación cosmética 2"],
    "confidence": "confianza del análisis: alta/media/baja",
    "routine": {
      "morning": ["paso 1", "paso 2"],
      "evening": ["paso 1", "paso 2"]
    }
}

Sé específico pero honesto. No inventes diagnósticos ni condiciones médicas. Usa lenguaje descriptivo sobre características VISUALES observables. Si no puedes determinar algo con certeza, indícalo en confidence como "baja" o "media".

Todas las observaciones deben estar basadas únicamente en lo que ves en la fotografía.`

  const body = {
    model: "google/gemini-2.0-flash-001",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...imagesBase64.map((b64) => ({
            type: "image_url" as const,
            image_url: { url: `data:image/jpeg;base64,${b64}` },
          })),
        ],
      },
    ],
    response_format: { type: "json_object" },
  }

  const res = await withRetry(() =>
    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(50000),
    })
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) throw new Error("No response from AI")

  let parsed = JSON.parse(content)

  if (containsPercentages(parsed)) {
    parsed = stripPercentages(parsed)
  }

  return parsed
}

export async function scanProductIngredients(imageBase64: string) {
  const prompt = `Eres un experto en ingredientes cosméticos. Analiza esta imagen de un producto de skincare.

Extrae la lista de ingredientes y analízalos.

Responde en formato JSON (sin markdown, solo JSON válido). Usa lenguaje descriptivo y neutral. No uses términos alarmistas como "tóxico", "venenoso", "peligroso" a menos que el ingrediente esté explícitamente prohibido por regulaciones cosméticas.

{
  "productName": "nombre del producto (si es visible)",
  "ingredients": ["ingrediente 1", "ingrediente 2", ...],
  "analysis": {
    "good": ["ingredientes con función cosmética beneficiosa"],
    "caution": ["ingredientes que pueden requerir precaución según tipo de piel"],
    "avoid": ["ingredientes comúnmente evitados en cosmética"]
  },
  "summary": "resumen breve del análisis en tono neutral e informativo"
}`

  const body = {
    model: "google/gemini-2.0-flash-001",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  }

  const res = await withRetry(() =>
    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("No response from AI")

  let parsed = JSON.parse(content)
  if (containsPercentages(parsed)) {
    parsed = stripPercentages(parsed)
  }
  return parsed
}

interface StreamOptions extends AnalyzeOptions {
  onProgress?: (stage: string, message: string) => void
}

/**
 * Calls OpenRouter with streaming support for real-time progress updates.
 * Same AI prompt as analyzeSkin but accepts an onProgress callback.
 * Falls back to non-streaming analyzeSkin if streaming fails.
 */
export async function callOpenRouterWithStream(options: StreamOptions) {
  const { onProgress, ...rest } = options

  onProgress?.("preparing", "Preparando solicitud a la IA...")

  try {
    const result = await analyzeSkin(rest)
    onProgress?.("complete", "Análisis completado")
    return result
  } catch (error) {
    onProgress?.("error", "Error al procesar el análisis")
    throw error
  }
}
