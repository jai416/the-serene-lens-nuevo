import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

function makeImageData(width: number, height: number, pixels: number[]) {
  return { data: new Uint8ClampedArray(pixels), width, height }
}

function flatGrayImage(w: number, h: number, gray: number): number[] {
  const pixels: number[] = []
  for (let i = 0; i < w * h; i++) {
    pixels.push(gray, gray, gray, 255)
  }
  return pixels
}

function checkerboardImage(w: number, h: number): number[] {
  const pixels: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const val = (x + y) % 2 === 0 ? 0 : 255
      pixels.push(val, val, val, 255)
    }
  }
  return pixels
}

describe("photo-quality", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubCanvas(imageData: any) {
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
      width: imageData.width, height: imageData.height, close: vi.fn(),
    }))
    vi.stubGlobal("OffscreenCanvas", vi.fn().mockImplementation(() => ({
      getContext: () => ({
        drawImage: vi.fn(),
        getImageData: () => imageData,
      }),
    })))
  }

  describe("validatePhoto", () => {
    it("passes a sharp, well-lit checkerboard image", async () => {
      const w = 100, h = 100
      const pixels = checkerboardImage(w, h)
      stubCanvas(makeImageData(w, h, pixels))

      const { validatePhoto } = await import("../photo-quality")
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const result = await validatePhoto(file)

      expect(result.blur.pass).toBe(true)
    })

    it("rejects a very blurry (flat gray) image", async () => {
      const w = 100, h = 100
      const pixels = flatGrayImage(w, h, 128)
      stubCanvas(makeImageData(w, h, pixels))

      const { validatePhoto } = await import("../photo-quality")
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const result = await validatePhoto(file)

      expect(result.blur.pass).toBe(false)
      expect(result.pass).toBe(false)
    })

    it("rejects a very dark image", async () => {
      const w = 100, h = 100
      const pixels = flatGrayImage(w, h, 10)
      stubCanvas(makeImageData(w, h, pixels))

      const { validatePhoto } = await import("../photo-quality")
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const result = await validatePhoto(file)

      expect(result.brightness.pass).toBe(false)
      expect(result.brightness.value).toBeLessThan(30)
      expect(result.pass).toBe(false)
    })

    it("rejects a very bright (overexposed) image", async () => {
      const w = 100, h = 100
      const pixels = flatGrayImage(w, h, 240)
      stubCanvas(makeImageData(w, h, pixels))

      const { validatePhoto } = await import("../photo-quality")
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const result = await validatePhoto(file)

      expect(result.brightness.pass).toBe(false)
      expect(result.brightness.value).toBeGreaterThan(230)
      expect(result.pass).toBe(false)
    })

    it("returns pass=true fallback when createImageBitmap fails", async () => {
      vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("unsupported")))

      const { validatePhoto } = await import("../photo-quality")
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const result = await validatePhoto(file)

      expect(result.pass).toBe(true)
      expect(result.blur.pass).toBe(true)
      expect(result.brightness.pass).toBe(true)
      expect(result.blur.message).toContain("No se pudo procesar")
    })

    it("returns pass=true fallback when OffscreenCanvas is unavailable", async () => {
      vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
        width: 100, height: 100, close: vi.fn(),
      }))
      vi.stubGlobal("OffscreenCanvas", undefined)

      const { validatePhoto } = await import("../photo-quality")
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const result = await validatePhoto(file)

      expect(result.pass).toBe(true)
      expect(result.blur.message).toContain("No se pudo procesar")
    })
  })
})
