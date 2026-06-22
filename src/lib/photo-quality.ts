export interface PhotoQualityResult {
  pass: boolean
  blur: { value: number; pass: boolean; message?: string }
  brightness: { value: number; pass: boolean; message?: string }
}

const BLUR_THRESHOLD = 12
const BRIGHTNESS_MIN = 30
const BRIGHTNESS_MAX = 230

function getGrayscalePixels(imageData: ImageData): number[] {
  const data = imageData.data
  const grayscale: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    grayscale.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
  }
  return grayscale
}

function detectBlur(imageData: ImageData): { value: number; pass: boolean } {
  const gray = getGrayscalePixels(imageData)
  const w = imageData.width
  const h = imageData.height
  let sum = 0
  let count = 0

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x
      const center = gray[idx]
      const left = gray[y * w + (x - 1)]
      const right = gray[y * w + (x + 1)]
      const up = gray[(y - 1) * w + x]
      const down = gray[(y + 1) * w + x]

      const laplacian = Math.abs(4 * center - left - right - up - down)
      sum += laplacian
      count++
    }
  }

  const mean = sum / count
  return { value: Math.round(mean), pass: mean >= BLUR_THRESHOLD }
}

function detectBrightness(imageData: ImageData): { value: number; pass: boolean } {
  const gray = getGrayscalePixels(imageData)
  const avg = gray.reduce((a, b) => a + b, 0) / gray.length

  return {
    value: Math.round(avg),
    pass: avg >= BRIGHTNESS_MIN && avg <= BRIGHTNESS_MAX,
  }
}

export async function validatePhoto(file: File): Promise<PhotoQualityResult> {
  try {
    if (typeof scheduler !== "undefined" && scheduler.yield) {
      await scheduler.yield()
    }

    const bitmap = await createImageBitmap(file)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(bitmap, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blur = detectBlur(imageData)
    const brightness = detectBrightness(imageData)

    return {
      pass: blur.pass && brightness.pass,
      blur: { ...blur, message: blur.pass ? undefined : "Foto borrosa. Toma una foto más nítida con buena iluminación." },
      brightness: {
        ...brightness,
        message: brightness.pass
          ? undefined
          : brightness.value < BRIGHTNESS_MIN
            ? "Foto muy oscura. Busca mejor iluminación."
            : "Foto muy sobreexpuesta. Evita luz directa.",
      },
    }
  } catch {
    return {
      pass: true,
      blur: { value: 0, pass: true },
      brightness: { value: 128, pass: true },
    }
  }
}
