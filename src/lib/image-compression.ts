const SMALL_FILE_THRESHOLD = 100 * 1024

function supportsWebP(): boolean {
  if (typeof document === "undefined") return false
  const canvas = document.createElement("canvas")
  return canvas.toDataURL("image/webp").indexOf("image/webp") === 0
}

const preferWebP = supportsWebP()

export class ImageCompressionError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = "ImageCompressionError"
  }
}

export async function compressImage(file: File, maxSizeMB = 10): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  if (file.size < SMALL_FILE_THRESHOLD) {
    return file
  }

  let img: ImageBitmap
  try {
    img = await createImageBitmap(file)
  } catch {
    throw new ImageCompressionError(
      "No se pudo leer la imagen. El archivo podría estar corrupto o en un formato no soportado."
    )
  }

  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new ImageCompressionError("No se pudo crear el canvas de compresión.")
    }

    let { width, height } = img
    const isSlowConnection =
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      ["slow-2g", "2g", "3g"].includes((navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType || "")
    const isOversized = file.size > maxSizeBytes
    // Max 1024px — more than enough for Groq, keeps files under 100KB
    const maxDimension = isOversized ? 640 : isSlowConnection ? 480 : 1024
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    canvas.width = width
    canvas.height = height
    ctx.drawImage(img, 0, 0, width, height)
    img.close()

    let quality = isOversized ? 0.4 : isSlowConnection ? 0.5 : 0.75
    const mimeType = preferWebP ? "image/webp" : "image/jpeg"
    let blob = await canvasToBlob(canvas, quality, mimeType)

    while (blob.size > maxSizeBytes && quality > 0.05) {
      quality -= 0.1
      blob = await canvasToBlob(canvas, quality, mimeType)
    }

    if (blob.size < file.size) {
      const ext = preferWebP ? "webp" : "jpg"
      const baseName = file.name.replace(/\.[^/.]+$/, "")
      return new File([blob], `${baseName}.${ext}`, { type: mimeType })
    }

    return file
  } catch (e) {
    if (e instanceof ImageCompressionError) throw e
    throw new ImageCompressionError("Error al comprimir la imagen.")
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
  mimeType: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b)
        } else {
          reject(new ImageCompressionError("No se pudo generar la imagen comprimida."))
        }
      },
      mimeType,
      quality
    )
  })
}
