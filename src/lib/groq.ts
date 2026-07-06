import { logger } from "@/lib/logger"

const GROQ_API_BASE = "https://api.groq.com/openai/v1"
const MODEL = "llama-3.2-11b-vision-preview"

const SYSTEM_PROMPT = `Eres un experto en cuidado cosmético de la piel. Actúa como un analista cosmético profesional.
Responde exclusivamente en español.
Reglas: Sin porcentajes. Sin inventar diagnósticos médicos. Solo características VISUALES observables.
Cada observación DEBE incluir un breve "por qué" explicando qué señal visual detectaste.
Si NO estás seguro de una observación, responde "No determinado".
Devuélveme los datos estructurados en este formato exacto y SOLO JSON:

{
  "skinType": "seca/grasa/mixta/normal/sensible",
  "texture": "uniforme/levemente irregular/irregular",
  "pores": "poco visibles/moderadamente visibles/visibles",
  "shine": "bajo/moderado/alto",
  "uniformity": "uniforme/parcialmente uniforme/heterogénea",
  "apparentSensitivity": "baja/moderada/elevada",
  "apparentOil": "baja/moderada/alta",
  "observations": ["observación visual 1", "observación visual 2"],
  "observationExplanations": {"clave observación 1": "breve explicación de qué señal visual llevó a esta observación"},
  "recommendations": ["recomendación cosmética 1", "recomendación cosmética 2"],
  "confidence": "alta/media/baja",
  "confidenceReason": "breve explicación del nivel de confianza",
  "routine": {"morning": ["paso 1", "paso 2"], "evening": ["paso 1", "paso 2"]}
}`

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("No GROQ_API_KEY configured")
  return key
}

function extractJSON(content: string): any {
  const clean = content.replace(/```json|```/g, "").trim()
  try {
    return JSON.parse(clean)
  } catch {}
  const match = content.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {}
  }
  throw new Error("No se pudo parsear la respuesta de Groq")
}

async function compressImage(file: File, maxDim = 512): Promise<Buffer> {
  const bytes = await file.arrayBuffer()
  try {
    const sharp = await import("sharp")
    const img = sharp.default(Buffer.from(bytes))
    const meta = await img.metadata()
    if ((meta.width && meta.width > maxDim) || (meta.height && meta.height > maxDim)) {
      return await img.resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer()
    }
  } catch {}
  return Buffer.from(bytes)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function groqFetch(
  imagesBuffer: Buffer[],
  prompt: string,
  attempt = 1
): Promise<any> {
  const key = getApiKey()
  const url = `${GROQ_API_BASE}/chat/completions`

  const content: any[] = [{ type: "text", text: prompt }]
  for (const buf of imagesBuffer) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${buf.toString("base64")}` },
    })
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (res.status === 429 && attempt < 3) {
    const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000)
    logger.warn("Groq rate limited, retrying", { attempt, delay })
    await sleep(delay)
    return groqFetch(imagesBuffer, prompt, attempt + 1)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content_text = data?.choices?.[0]?.message?.content
  if (!content_text) throw new Error("Groq returned empty response")

  try {
    return extractJSON(content_text)
  } catch (e) {
    throw new Error("Groq returned invalid JSON. Try again.")
  }
}

export async function analyzeSkinWithGroq(files: File[]) {
  const buffers = await Promise.all(files.map((f) => compressImage(f)))
  return groqFetch(buffers, "Analiza esta foto facial y devuelve el JSON en el formato especificado.")
}
