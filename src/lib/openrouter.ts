import { getEnv } from "@/lib/env"

const env = getEnv()

interface AnalyzeOptions {
  imagesBase64: string[]
  concerns?: string
  age?: string
  gender?: string
  climate?: string
  routine?: string
}

export async function analyzeSkin({
  imagesBase64,
  concerns,
  age,
  gender,
  climate,
  routine,
}: AnalyzeOptions) {
  const prompt = `Eres un experto en cuidado cosmético de la piel. Analiza esta foto de piel facial.

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

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(50000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) throw new Error("No response from AI")

  return JSON.parse(content)
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

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("No response from AI")

  return JSON.parse(content)
}
