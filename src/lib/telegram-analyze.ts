import { logger } from "@/lib/logger"
import { sendTelegramMessage } from "@/lib/telegram"
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit"

/** URL de registro con atribución para el embudo de Telegram. */
function getRegUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || ""
  return `${base}/register?callbackUrl=/analysis&from=telegram`
}

/**
 * Funnel de adquisición por Telegram: el usuario envía fotos de su rostro,
 * el bot devuelve un análisis de piel y un CTA de registro.
 *
 * Este es el canal de crecimiento principal en Cuba: Telegram no necesita
 * email, ni tarjeta, ni app instalada.
 */

const MAX_PHOTOS = 3
const PHOTO_TTL_MS = 30 * 60 * 1000

interface PendingAnalysis {
  photos: Buffer[]
  startedAt: number
}

const pending = new Map<string, PendingAnalysis>()

function getPending(chatId: string): PendingAnalysis | undefined {
  const entry = pending.get(chatId)
  if (!entry) return undefined
  if (Date.now() - entry.startedAt > PHOTO_TTL_MS) {
    pending.delete(chatId)
    return undefined
  }
  return entry
}

/** Descarga una foto de Telegram y la devuelve en base64. */
async function downloadTelegramPhoto(fileId: string): Promise<Buffer | null> {
  const token = process.env.TELEGRAM_TOKEN
  if (!token) return null
  try {
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
    )
    if (!fileRes.ok) return null
    const fileData = (await fileRes.json()) as { result?: { file_path?: string } }
    const filePath = fileData.result?.file_path
    if (!filePath) return null

    const urlRes = await fetch(
      `https://api.telegram.org/file/bot${token}/${filePath}`
    )
    if (!urlRes.ok) return null
    const bytes = Buffer.from(await urlRes.arrayBuffer())

    if (bytes.length > 10 * 1024 * 1024) {
      logger.warn("Telegram photo too large", { size: bytes.length })
      return null
    }
    return bytes
  } catch (e) {
    logger.error("Telegram photo download failed", {
      error: e instanceof Error ? e.message : String(e),
    })
    return null
  }
}

const INSTRUCTIONS = `📸 <b>Análisis de piel con IA</b>

Envíame de <b>1 a 3 fotos</b> de tu rostro:
• Frontal (obligatoria)
• Perfil izquierdo y derecho (opcionales)

Sin filtros, sin maquillaje y con buena luz natural.

Cuando termines escribe <b>/listo</b> para recibir tu análisis.

💡 También puedes usar el análisis completo en la web (sube hasta 3 fotos y guarda tu historial).`

export async function handleAnalizarCommand(chatId: string): Promise<void> {
  pending.delete(chatId)
  await sendTelegramMessage(chatId, INSTRUCTIONS)
}

/**
 * Guarda una foto recibida. Cuando lleva MAX_PHOTOS o el usuario escribe
 * /listo, lanza el análisis.
 */
export async function handlePhotoMessage(
  chatId: string,
  photoFileIds: string[]
): Promise<void> {
  // Telegram manda el array de tamaños: el último es el de mayor resolución
  const largest = photoFileIds[photoFileIds.length - 1]
  if (!largest) return

  const bytes = await downloadTelegramPhoto(largest)
  if (!bytes) {
    await sendTelegramMessage(
      chatId,
      "No pude descargar la foto. Envíala de nuevo, por favor."
    )
    return
  }

  let entry = getPending(chatId)
  if (!entry) {
    entry = { photos: [], startedAt: Date.now() }
    pending.set(chatId, entry)
    await sendTelegramMessage(chatId, "📸 Foto recibida. Envía más ángulos o escribe <b>/listo</b> para analizar.")
  } else if (entry.photos.length >= MAX_PHOTOS) {
    await sendTelegramMessage(
      chatId,
      `Ya tengo ${MAX_PHOTOS} fotos. Escribe <b>/listo</b> para recibir tu análisis.`
    )
    return
  } else {
    entry.photos.push(bytes)
    const n = entry.photos.length
    await sendTelegramMessage(
      chatId,
      `Foto ${n + 1} recibida.${n >= MAX_PHOTOS ? " Escribe <b>/listo</b> para analizar." : " Envía más ángulos o escribe <b>/listo</b>."}`
    )
    if (n >= MAX_PHOTOS) {
      await runAnalysis(chatId)
    }
    return
  }

  // primera foto: se guarda también
  entry.photos.push(bytes)
}

/** Lanza el análisis con las fotos acumuladas. */
export async function handleListoCommand(chatId: string): Promise<void> {
  const entry = getPending(chatId)
  if (!entry || entry.photos.length === 0) {
    await sendTelegramMessage(
      chatId,
      "No tengo fotos tuyas todavía. Envíame al menos una foto de tu rostro y luego escribe <b>/listo</b>."
    )
    return
  }
  await runAnalysis(chatId)
}

async function runAnalysis(chatId: string): Promise<void> {
  const entry = getPending(chatId)
  if (!entry || entry.photos.length === 0) return

  // Límite: el análisis consume tokens de IA
  const rl = await checkRateLimit(`telegram:analyze:${chatId}`, 3, 24 * 60 * 60 * 1000)
  if (!rl.allowed) {
    pending.delete(chatId)
    await sendTelegramMessage(
      chatId,
      "Llegaste a tu límite de 3 análisis gratis por día en Telegram. En la web tienes 3 al mes con tu cuenta gratuita."
    )
    return
  }

  await sendTelegramMessage(chatId, "⏳ Analizando tu piel... esto toma unos segundos.")

  try {
    const { analyzeSkinWithGroq } = await import("@/lib/groq")
    const files = entry.photos.map(
      (buf, i) => new File([new Uint8Array(buf)], `photo-${i}.jpg`, { type: "image/jpeg" })
    )

    const result = await analyzeSkinWithGroq(files, {})

    pending.delete(chatId)

    const message = formatResult(result)
    await sendTelegramMessage(chatId, message)
  } catch (e) {
    // Se devuelve el intento si la IA falló (no es culpa del usuario)
    await clearRateLimit(`telegram:analyze:${chatId}`).catch(() => {})
    pending.delete(chatId)
    logger.error("Telegram analysis failed", {
      chatId,
      error: e instanceof Error ? e.message : String(e),
    })
    await sendTelegramMessage(
      chatId,
      "No pude analizar las fotos. Asegúrate de que se vea tu rostro con buena luz e inténtalo de nuevo."
    )
  }
}

export function formatResult(result: Record<string, unknown>): string {
  const skinType =
    (result.tipoDePiel as string) || (result.skinType as string) || ""
  const summary = (result.resumenGeneral as string) || ""
  const observations = Array.isArray(result.observations)
    ? (result.observations as Array<Record<string, string>>)
    : []
  const recommendations = (result.recomendaciones as string[]) ||
    (result.recommendations as string[]) || []
  const routine = (result.rutina || result.routine) as
    | { manana?: string[]; noche?: string[]; morning?: string[]; evening?: string[] }
    | null
    | undefined

  const lines: string[] = []
  lines.push("✅ <b>Tu análisis de piel está listo</b>")
  if (skinType) lines.push(`\n<b>Tipo de piel:</b> ${skinType}`)
  if (summary) lines.push(`\n${summary}`)

  if (observations.length > 0) {
    lines.push("\n<b>Observaciones</b>")
    for (const o of observations.slice(0, 6)) {
      // El shape canónico guarda strings; el crudo de la IA trae {zona,detalle,severidad}
      if (typeof o === "string") {
        lines.push(`• ${o}`)
        continue
      }
      const detalle = o.detalle || o.detail || ""
      const zona = o.zona || ""
      const severidad = o.severidad || ""
      if (detalle) lines.push(`• ${zona ? `<b>${zona}:</b> ` : ""}${detalle}${severidad ? ` (${severidad})` : ""}`)
    }
  }

  if (recommendations.length > 0) {
    lines.push("\n<b>Recomendaciones</b>")
    for (const r of recommendations.slice(0, 5)) lines.push(`• ${r}`)
  }

  const morning = routine?.manana || routine?.morning || []
  const evening = routine?.noche || routine?.evening || []
  if (morning.length > 0) {
    lines.push("\n<b>Rutina de mañana</b>")
    morning.forEach((s: string, i: number) => lines.push(`${i + 1}. ${s}`))
  }
  if (evening.length > 0) {
    lines.push("\n<b>Rutina de noche</b>")
    evening.forEach((s: string, i: number) => lines.push(`${i + 1}. ${s}`))
  }

  // CTA de conversión: el resultado es el anzuelo, el registro es el objetivo
  lines.push(
    `\n━━━━━━━━━━━━━━\n🔒 <b>Guarda tu resultado</b>\nCrea tu cuenta gratis y conserva tu historial, compara evolución y recibe tus rutinas guardadas:\n${getRegUrl()}`
  )

  return lines.join("\n")
}
