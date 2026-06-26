/**
 * Detects WebP support in the browser using canvas.
 * Returns true if the browser can encode to image/webp.
 */
export function supportsWebP(): boolean {
  if (typeof document === "undefined") return false
  const canvas = document.createElement("canvas")
  return canvas.toDataURL("image/webp").indexOf("image/webp") === 0
}

/**
 * Converts an image File to WebP format with configurable quality and max dimensions.
 * Falls back to JPEG if WebP is not supported.
 *
 * @param file - Source image file
 * @param options.quality - JPEG/WebP quality 0-1 (default 0.85)
 * @param options.maxWidth - Maximum width in pixels (default 1920)
 * @param options.maxHeight - Maximum height in pixels (default 1920)
 * @returns New File in WebP (preferred) or JPEG format
 */
export async function optimizeToWebP(
  file: File,
  options?: { quality?: number; maxWidth?: number; maxHeight?: number }
): Promise<File> {
  const { quality = 0.85, maxWidth = 1920, maxHeight = 1920 } = options || {}

  if (file.size < 100 * 1024) return file

  const img = await createImageBitmap(file)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  let { width, height } = img
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  canvas.width = width
  canvas.height = height
  ctx.drawImage(img, 0, 0, width, height)
  img.close()

  const preferWebP = supportsWebP()
  const mimeType = preferWebP ? "image/webp" : "image/jpeg"
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error("Canvas toBlob failed"))
    }, mimeType, quality)
  })

  const ext = preferWebP ? "webp" : "jpg"
  const baseName = file.name.replace(/\.[^/.]+$/, "")
  return new File([blob], `${baseName}.${ext}`, { type: mimeType })
}
