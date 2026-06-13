const SMALL_FILE_THRESHOLD = 100 * 1024 // 100KB

export async function compressImage(file: File, maxSizeMB = 10): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  if (file.size <= maxSizeBytes) {
    if (file.size < SMALL_FILE_THRESHOLD) {
      return file
    }

    const img = await createImageBitmap(file)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    let { width, height } = img
    const maxDimension = 1920
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    canvas.width = width
    canvas.height = height
    ctx.drawImage(img, 0, 0, width, height)
    img.close()

    let quality = 0.85
    let blob = await canvasToBlob(canvas, quality)

    while (blob.size > file.size && quality > 0.05) {
      quality -= 0.1
      blob = await canvasToBlob(canvas, quality)
    }

    if (blob.size < file.size) {
      return new File([blob], file.name, { type: "image/jpeg" })
    }
  }

  return file
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b!),
      "image/jpeg",
      quality
    )
  })
}
