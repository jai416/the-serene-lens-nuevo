import { logger } from "@/lib/logger"

const GROQ_API_BASE = "https://api.groq.com/openai/v1"
const MODEL = "llama-3.2-11b-vision-preview"

const SYSTEM_PROMPT = `Eres un modelo analítico avanzado de IA especializado en estética cosmética y análisis visual del cuidado de la piel. Tu función es evaluar las imágenes de la piel del usuario (frontal, perfil izquierdo, perfil derecho) junto con sus respuestas.

REGLAS ABSOLUTAS DE COMPORTAMIENTO:
1. NO eres un dermatólogo ni un médico. Evita por completo el lenguaje clínico, diagnósticos de enfermedades patológicas (como melasma severo, dermatitis, etc.) o términos médicos alarmantes.
2. NO utilices porcentajes numéricos para evaluar la severidad de los problemas. Utiliza etiquetas descriptivas claras (ej: "Leve", "Moderado", "Lanzando brotes puntuales") y badges de severidad.
3. Adapta las prioridades de la rutina según la década de edad del usuario y el clima tropical húmedo (enfoque en texturas fluidas, geles, sueros de rápida absorción y protección solar estricta).
4. Integra la base de conocimiento de ingredientes estáticos del sistema: sugiere activos como Niacinamida, Ácido Salicílico o Centella Asiática explicando su mecanismo cosmético.

DEBES DEVOLVER ESTRICTAMENTE UN OBJETO JSON con la siguiente estructura de 8 secciones:

{
  "resumenGeneral": "Un párrafo empático, claro y directo sobre el estado actual observado.",
  "tipoDePiel": "Descriptivo (ej: Mixta con tendencia a brillo en zona T)",
  "observations": [
    { "zona": "Frente", "detalle": "Presencia de texturas finas o comedones cerrados", "severidad": "Leve" }
  ],
  "observationExplanations": "Explicación sencilla de por qué se observan estos factores (calor, sudor, obstrucción por humedad).",
  "confidenceReason": "Razón estética por la cual la IA determina este estado basándose en la iluminación y claridad de los ángulos provistos.",
  "factores": ["Deshidratación superficial", "Exceso de sebo"],
  "recomendaciones": ["Priorizar limpieza doble en las noches", "Evitar exfoliantes físicos agresivos"],
  "rutina": {
    "manana": ["Paso 1: Limpiador en gel", "Paso 2: Hidratante fluido", "Paso 3: Protector solar toque seco"],
    "noche": ["Paso 1: Agua micelar", "Paso 2: Limpiador en gel", "Paso 3: Suero renovador"]
  },
  "productosRecomendados": ["Limpiadores en gel seborreguladores", "Sueros ligeros de niacinamida"],
  "historialComparativo": "Nota breve indicando pautas visuales para que el usuario monitoree su evolución en sus próximos escaneos."
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
    const text = await res.text().catch(() => "unknown")
    logger.error("Groq API error", { status: res.status, body: text.slice(0, 500), attempt })
    if (res.status === 429) {
      throw new Error("Demasiadas solicitudes a la IA. Espera un momento.")
    }
    if (res.status >= 500) {
      throw new Error("El servicio de IA está temporalmente no disponible.")
    }
    throw new Error(`Error de IA (${res.status}). Intenta de nuevo.`)
  }

  const data = await res.json()
  const content_text = data?.choices?.[0]?.message?.content
  if (!content_text) {
    logger.error("Groq empty response", { data: JSON.stringify(data).slice(0, 500) })
    throw new Error("La IA no generó una respuesta válida.")
  }

  try {
    return extractJSON(content_text)
  } catch (e) {
    logger.error("Groq invalid JSON", { content: content_text.slice(0, 1000) })
    throw new Error("La IA devolvió un formato inválido. Intenta con fotos más claras.")
  }
}

export async function analyzeSkinWithGroq(files: File[]) {
  const buffers = await Promise.all(files.map((f) => compressImage(f)))
  return groqFetch(buffers, "Analiza esta foto facial y devuelve el JSON en el formato especificado.")
}
