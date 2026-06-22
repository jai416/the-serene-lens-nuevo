import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCache, setCache, delCache, clearCache } from "@/lib/cache"

describe("cache", () => {
  beforeEach(() => {
    clearCache()
  })

  it("stores and retrieves values", () => {
    setCache("key1", { foo: "bar" })
    expect(getCache("key1")).toEqual({ foo: "bar" })
  })

  it("returns undefined for missing keys", () => {
    expect(getCache("nonexistent")).toBeUndefined()
  })

  it("deletes values", () => {
    setCache("temp", "value")
    delCache("temp")
    expect(getCache("temp")).toBeUndefined()
  })

  it("clears all values", () => {
    setCache("a", 1)
    setCache("b", 2)
    clearCache()
    expect(getCache("a")).toBeUndefined()
    expect(getCache("b")).toBeUndefined()
  })

  it("stores with custom TTL", async () => {
    setCache("fast", "gone", 0)
    await new Promise((r) => setTimeout(r, 10))
    expect(getCache("fast")).toBeUndefined()
  })

  it("preserves value before TTL expiry", () => {
    setCache("keep", "alive", 60)
    expect(getCache("keep")).toBe("alive")
  })

  it("handles complex data types", () => {
    const data = { users: [{ id: 1, name: "Alice" }], count: 1 }
    setCache("complex", data)
    expect(getCache("complex")).toEqual(data)
  })
})
