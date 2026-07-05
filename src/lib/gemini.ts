import { logger } from "@/lib/logger"
import { markKeyDead } from "@/lib/gemini-keys"

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
const MODEL = "gemini-2.0-flash"

function getApiKeys(): string[] {
  const keys: string[] = []
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]
    if (k) keys.push(k)
  }
  if (keys.length === 0) {
    const single = process.env.GEMINI_API_KEY
    if (single) keys.push(single)
  }
  return keys
}

let keyIndex = 0
function getNextKey(): string {
  const keys = getApiKeys()
  if (keys.length === 0) throw new Error("No GEMINI_API_KEY configured")
  const key = keys[keyIndex % keys.length]
  keyIndex++
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
  throw new Error("No se pudo parsear la respuesta de Gemini")
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
  return buffer
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function geminiFetch(
  imagesBuffer: Buffer[],
  prompt: string,
  attempt = 1
): Promise<any> {
  const key = getNextKey()
  const url = `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${key}`

  const parts: any[] = [{ text: prompt }]
  for (const buf of imagesBuffer) {
    parts.push({
      inline_data: { mime_type: "image/jpeg", data: buf.toString("base64") },
    })
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (res.status === 429 && attempt < 3) {
    const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000)
    logger.warn("Gemini rate limited, retrying", { attempt, delay })
    await sleep(delay)
    return geminiFetch(imagesBuffer, prompt, attempt + 1)
  }

  if (!res.ok) {
    const text = await res.text()
    if (res.status === 403 || res.status === 401) {
      markKeyDead(key)
    }
    throw new Error(`Gemini error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error("Gemini returned empty response")

  try {
    return extractJSON(content)
  } catch (e) {
    throw new Error("Gemini returned invalid JSON. Try again.")
  }
}

const SKIN_PROMPT = `Eres un experto en cuidado cosmético de la piel. Analiza esta foto facial.
Reglas: Sin porcentajes. Sin inventar diagnósticos médicos. Solo características VISUALES observables.

Responde SOLO con JSON:
{
  "skinType": "seca/grasa/mixta/normal/sensible",
  "texture": "uniforme/levemente irregular/irregular",
  "pores": "poco visibles/moderadamente visibles/visibles",
  "shine": "bajo/moderado/alto",
  "uniformity": "uniforme/parcialmente uniforme/heterogénea",
  "apparentSensitivity": "baja/moderada/elevada",
  "apparentOil": "baja/moderada/alta",
  "observations": ["obs1", "obs2"],
  "observationExplanations": {"obs1": "por qué"},
  "recommendations": ["rec1", "rec2"],
  "confidence": "alta/media/baja",
  "confidenceReason": "por qué",
  "routine": {"morning": ["paso1"], "evening": ["paso2"]}
}`

export async function analyzeSkinWithGemini(files: File[]) {
  const buffers = await Promise.all(files.map((f) => compressImage(f)))
  return geminiFetch(buffers, SKIN_PROMPT)
}
