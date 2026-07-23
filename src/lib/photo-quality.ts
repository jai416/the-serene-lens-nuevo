export interface PhotoQualityResult {
  pass: boolean
  blur: { value: number; pass: boolean; message?: string }
  brightness: { value: number; pass: boolean; message?: string }
  face: { detected: boolean; count: number; message?: string }
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

/**
 * Simple face detection using skin-color heuristic + edge density.
 * Does NOT use external ML models. Estimates face presence based on:
 * 1. Skin-tone pixel ratio in center region
 * 2. Edge density in expected face region
 * 3. Aspect ratio of detected face-like area
 *
 * For large images (>500KB), skips edge density check and uses a coarser
 * downsampled scan (every 6px) to keep performance reasonable on slow connections.
 */
function detectFace(imageData: ImageData): { detected: boolean; count: number; message?: string } {
  const { width: w, height: h, data } = imageData

  const isLarge = data.byteLength > 500 * 1024
  const step = isLarge ? 6 : 3

  // Analyze center 60% of image (where face typically is)
  const startX = Math.floor(w * 0.2)
  const endX = Math.floor(w * 0.8)
  const startY = Math.floor(h * 0.15)
  const endY = Math.floor(h * 0.85)

  let skinPixels = 0
  let totalPixels = 0

  for (let y = startY; y < endY; y += step) {
    for (let x = startX; x < endX; x += step) {
      const idx = (y * w + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)

      if (
        r > 60 && g > 40 && b > 20 &&
        r > g && r > b &&
        max - min > 15 &&
        Math.abs(r - g) > 15 &&
        r > 80
      ) {
        skinPixels++
      }
      totalPixels++
    }
  }

  const skinRatio = totalPixels > 0 ? skinPixels / totalPixels : 0

  if (isLarge) {
    // For large images, trust skin-tone ratio alone — skip expensive edge check
    const hasFace = skinRatio > 0.25
    if (!hasFace) {
      if (skinRatio < 0.15) {
        return { detected: false, count: 0, message: "No se detectó rostro. Asegúrate de que tu cara esté centrada y bien iluminada." }
      }
      return { detected: false, count: 0, message: "No se detectó rostro. Toma una foto frontal de tu cara." }
    }
    return { detected: true, count: 1 }
  }

  // Edge density check (faces have characteristic edge patterns)
  let edgeCount = 0
  let edgeTotal = 0

  for (let y = startY + 1; y < endY - 1; y += step) {
    for (let x = startX + 1; x < endX - 1; x += step) {
      const idx = (y * w + x) * 4
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      const grayRight = 0.299 * data[(y * w + (x + 1)) * 4] + 0.587 * data[(y * w + (x + 1)) * 4 + 1] + 0.114 * data[(y * w + (x + 1)) * 4 + 2]
      const grayDown = 0.299 * data[((y + 1) * w + x) * 4] + 0.587 * data[((y + 1) * w + x) * 4 + 1] + 0.114 * data[((y + 1) * w + x) * 4 + 2]

      if (Math.abs(gray - grayRight) > 20 || Math.abs(gray - grayDown) > 20) {
        edgeCount++
      }
      edgeTotal++
    }
  }

  const edgeRatio = edgeTotal > 0 ? edgeCount / edgeTotal : 0

  // Heuristic: face detected if skin ratio > 25% and edge density 15-60%
  const hasFace = skinRatio > 0.25 && edgeRatio > 0.15 && edgeRatio < 0.60

  if (!hasFace) {
    if (skinRatio < 0.15) {
      return { detected: false, count: 0, message: "No se detectó rostro. Asegúrate de que tu cara esté centrada y bien iluminada." }
    }
    if (edgeRatio < 0.10) {
      return { detected: false, count: 0, message: "Foto muy uniforme. Asegúrate de enfocar tu rostro, no un fondo plano." }
    }
    return { detected: false, count: 0, message: "No se detectó rostro. Toma una foto frontal de tu cara." }
  }

  return { detected: true, count: 1 }
}

export async function validatePhoto(file: File): Promise<PhotoQualityResult> {
  try {
    if (typeof scheduler !== "undefined" && scheduler.yield) {
      await scheduler.yield()
    }

    const bitmap = await createImageBitmap(file)

    const isSlowConnection =
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      ["slow-2g", "2g", "3g"].includes((navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType || "")

    const isLargeFile = file.size > 500 * 1024
    const downsample = isSlowConnection || isLargeFile

    const targetW = downsample ? Math.min(bitmap.width, 640) : bitmap.width
    const targetH = downsample ? Math.round((bitmap.height / bitmap.width) * targetW) : bitmap.height

    const canvas = new OffscreenCanvas(targetW, targetH)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    const imageData = ctx.getImageData(0, 0, targetW, targetH)
    bitmap.close()

    const blur = detectBlur(imageData)
    const brightness = detectBrightness(imageData)
    const face = detectFace(imageData)

    return {
      pass: blur.pass && brightness.pass && face.detected,
      blur: { ...blur, message: blur.pass ? undefined : "Foto borrosa. Toma una foto más nítida con buena iluminación." },
      brightness: {
        ...brightness,
        message: brightness.pass
          ? undefined
          : brightness.value < BRIGHTNESS_MIN
            ? "Foto muy oscura. Busca mejor iluminación."
            : "Foto muy sobreexpuesta. Evita luz directa.",
      },
      face,
    }
  } catch {
    return {
      pass: true,
      blur: { value: 0, pass: true, message: "No se pudo procesar la imagen. Se continúa con la subida." },
      brightness: { value: 0, pass: true, message: "No se pudo medir brillo. Se continúa con la subida." },
      face: { detected: true, count: 1, message: "No se pudo verificar el rostro. Se continúa con la subida." },
    }
  }
}
