import { logger } from "@/lib/logger"
import { analyzeMultipleImagesWithGemini } from "@/lib/gemini-vision"

function buildSystemPrompt(context: {
  age?: string
  concerns?: string
  gender?: string
  climate?: string
  routine?: string
  previousSkinType?: string | null
  previousObservations?: string[] | null
  history?: string
}): string {
  const ageContext = context.age ? `El/la usuario/a tiene ${context.age} años.` : ""
  const concernsContext = context.concerns ? `Sus principales preocupaciones son: ${context.concerns}.` : ""
  const routineContext = context.routine ? `Rutina actual: ${context.routine}.` : ""
  const climateContext = context.climate ? `Clima: ${context.climate}.` : "Clima: Tropical húmedo (predeterminado)."
  const previousContext = context.previousSkinType
    ? `Análisis anterior: Piel ${context.previousSkinType}. ${context.previousObservations?.length ? `Observaciones previas: ${context.previousObservations.slice(0, 2).join(", ")}.` : ""} Compara y destaca cambios.`
    : ""
  const historyContext = context.history || ""

  return `Eres un experto en análisis cosmético y cuidado de la piel. Tu función es evaluar imágenes faciales del usuario (frontal, perfil izquierdo, perfil derecho) combinadas con su información personal para generar un análisis completo y útil.

CONTEXTO DEL USUARIO:
${ageContext}
${concernsContext}
${routineContext}
${climateContext}
${previousContext}

${historyContext ? `${historyContext}\n` : ""}

REGLAS ABSOLUTAS:
1. NO eres un dermatólogo ni un médico. Nunca uses lenguaje clínico, diagnósticos de enfermedades (melasma, dermatitis, rosácea severa, etc.) ni términos que puedan alarmar.
2. NO uses porcentajes ni números para severidad. Usa SOLO etiquetas descriptivas: "Leve", "Moderado", "Visible", "Lanzando brotes puntuales", "Mínimo".
3. Clima tropical húmedo: prioriza texturas fluidas, geles, sueros, protección solar de amplio espectro (SPF 50+), limpieza doble.
4. Según la edad del usuario, ajusta el enfoque: menor de 25 (prevención + control de sebo), 25-35 (primeros signos + hidratación), 35-45 (firmeza + luminosidad), 45+ (nutrición + soporte).
5. Si el usuario indicó preocupaciones específicas, priorízalas en el análisis.
6. Sugiere activos cosméticos explicando brevemente su función (ej: "Niacinamida: regula el sebo y unifica el tono"). Usa ingredientes como: Niacinamida, Ácido Salicílico, Ácido Hialurónico, Centella Asiática, Vitamina C, Retinol (uso nocturno), Escualano, Ceramidas, Zinc, Té Verde.
7. El lenguaje de la respuesta debe coincidir con el mismo idioma de las preguntas (español por defecto).
8. El usuario tiene un HISTORIAL de análisis. COMPARA el análisis actual con los anteriores, destacando cambios: "En tu último análisis vimos X, ahora notamos Y", "Desde tu análisis del [fecha] has mejorado en Z", etc. Da seguimiento real, no trates cada análisis como si fuera la primera vez.

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

async function geminiFetch(
  imagesBuffer: Buffer[],
  prompt: string,
  systemPrompt: string,
): Promise<any> {
  const imagesBase64 = imagesBuffer.map((buf) => buf.toString("base64"))
  try {
    return await analyzeMultipleImagesWithGemini(imagesBase64, prompt, systemPrompt, {
      temperature: 0.2,
      maxTokens: 4096,
    })
  } catch (e) {
    logger.error("Gemini vision analysis failed", { error: e instanceof Error ? e.message : String(e) })
    throw e
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
  } catch (e) { logger.error("Image resize failed", { error: e }) }
  return Buffer.from(bytes)
}

export async function analyzeSkinWithGroq(
  files: File[],
  context: {
    age?: string
    concerns?: string
    gender?: string
    climate?: string
    routine?: string
    previousSkinType?: string | null
    previousObservations?: string[] | null
    history?: string
  } = {}
) {
  const buffers = await Promise.all(files.map((f) => compressImage(f)))
  const systemPrompt = buildSystemPrompt(context)
  const userPrompt = `Analiza estas fotos faciales del usuario. Evalúa: textura, poros, hidratación, sebo, pigmentación, líneas de expresión, ojeras, y uniformidad del tono. Identifica las zonas específicas (frente, mejillas, nariz, barbilla, contorno de ojos). Devuelve el JSON exacto en el formato especificado.`
  return geminiFetch(buffers, userPrompt, systemPrompt)
}
