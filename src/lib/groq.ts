import { logger } from "@/lib/logger"

const GROQ_API_BASE = "https://api.groq.com/openai/v1"
const MODEL = "llama-3.2-11b-vision-preview"

function buildSystemPrompt(context: { age?: string; concerns?: string; gender?: string; climate?: string; routine?: string }): string {
  const ageContext = context.age ? `El/la usuario/a tiene ${context.age} años.` : ""
  const concernsContext = context.concerns ? `Sus principales preocupaciones son: ${context.concerns}.` : ""
  const routineContext = context.routine ? `Rutina actual: ${context.routine}.` : ""
  const climateContext = context.climate ? `Clima: ${context.climate}.` : "Clima: Tropical húmedo (predeterminado)."

  return `Eres un experto en análisis cosmético y cuidado de la piel. Tu función es evaluar imágenes faciales del usuario (frontal, perfil izquierdo, perfil derecho) combinadas con su información personal para generar un análisis completo y útil.

CONTEXTO DEL USUARIO:
${ageContext}
${concernsContext}
${routineContext}
${climateContext}

REGLAS ABSOLUTAS:
1. NO eres un dermatólogo ni un médico. Nunca uses lenguaje clínico, diagnósticos de enfermedades (melasma, dermatitis, rosácea severa, etc.) ni términos que puedan alarmar.
2. NO uses porcentajes ni números para severidad. Usa SOLO etiquetas descriptivas: "Leve", "Moderado", "Visible", "Lanzando brotes puntuales", "Mínimo".
3. Clima tropical húmedo: prioriza texturas fluidas, geles, sueros, protección solar de amplio espectro (SPF 50+), limpieza doble.
4. Según la edad del usuario, ajusta el enfoque: menor de 25 (prevención + control de sebo), 25-35 (primeros signos + hidratación), 35-45 (firmeza + luminosidad), 45+ (nutrición + soporte).
5. Si el usuario indicó preocupaciones específicas, priorízalas en el análisis.
6. Sugiere activos cosméticos explicando brevemente su función (ej: "Niacinamida: regula el sebo y unifica el tono"). Usa ingredientes como: Niacinamida, Ácido Salicílico, Ácido Hialurónico, Centella Asiática, Vitamina C, Retinol (uso nocturno), Escualano, Ceramidas, Zinc, Té Verde.
7. El lenguaje de la respuesta debe coincidir con el mismo idioma de las preguntas (español por defecto).

DEBES DEVOLVER ESTRICTAMENTE UN JSON con esta estructura exacta:

{
  "resumenGeneral": "Texto empático y claro sobre el estado general observado.",
  "tipoDePiel": "Ej: Mixta con tendencia a brillo en zona T",
  "observations": [
    { "zona": "Frente", "detalle": "Descripción corta", "severidad": "Leve" }
  ],
  "observationExplanations": "Por qué aparecen estos factores en clima tropical.",
  "confidenceReason": "Qué tan claras están las imágenes para este análisis.",
  "factores": ["Factor 1", "Factor 2"],
  "recomendaciones": ["Recomendación 1", "Recomendación 2"],
  "rutina": {
    "manana": ["Paso 1", "Paso 2", "Paso 3"],
    "noche": ["Paso 1", "Paso 2", "Paso 3"]
  },
  "productosRecomendados": ["Tipo de producto sugerido con activo clave"],
  "historialComparativo": "Qué monitorear en el próximo análisis para ver evolución."
}`
}

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
  return {
    resumenGeneral: "No se pudo analizar la imagen con claridad suficiente.",
    tipoDePiel: "No determinado",
    observations: [],
    observationExplanations: "",
    confidenceReason: "La imagen no tenía la claridad suficiente para un análisis confiable.",
    factores: [],
    recomendaciones: ["Por favor, repite el análisis con mejor iluminación y enfoque nítido."],
    rutina: { manana: [], noche: [] },
    productosRecomendados: [],
    historialComparativo: "",
    _fallback: true,
  }
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
  systemPrompt: string,
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
        { role: "system", content: systemPrompt },
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
    return groqFetch(imagesBuffer, prompt, systemPrompt, attempt + 1)
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
    return extractJSON("")
  }

  return extractJSON(content_text)
}

export async function analyzeSkinWithGroq(
  files: File[],
  context: { age?: string; concerns?: string; gender?: string; climate?: string; routine?: string } = {}
) {
  const buffers = await Promise.all(files.map((f) => compressImage(f)))
  const systemPrompt = buildSystemPrompt(context)
  const userPrompt = `Analiza estas fotos faciales del usuario. Evalúa: textura, poros, hidratación, sebo, pigmentación, líneas de expresión, ojeras, y uniformidad del tono. Identifica las zonas específicas (frente, mejillas, nariz, barbilla, contorno de ojos). Devuelve el JSON exacto en el formato especificado.`
  return groqFetch(buffers, userPrompt, systemPrompt)
}
