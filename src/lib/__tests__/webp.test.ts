import { describe, it, expect } from "vitest"

describe("supportsWebP", () => {
  it("returns false in Node.js (no document)", async () => {
    const { supportsWebP } = await import("../webp")
    expect(supportsWebP()).toBe(false)
  })
})

describe("optimizeToWebP", () => {
  it("returns original file for small files (< 100KB)", async () => {
    const { optimizeToWebP } = await import("../webp")
    const smallFile = new File(["a".repeat(50 * 1024)], "test.jpg", { type: "image/jpeg" })
    const result = await optimizeToWebP(smallFile)
    expect(result).toBe(smallFile)
  })

  it("accepts options parameter", async () => {
    const { optimizeToWebP } = await import("../webp")
    const smallFile = new File(["tiny"], "small.jpg", { type: "image/jpeg" })
    const result = await optimizeToWebP(smallFile, { quality: 0.5, maxWidth: 800, maxHeight: 600 })
    expect(result).toBe(smallFile)
  })
})
