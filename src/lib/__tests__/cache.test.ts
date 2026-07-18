import { describe, it, expect, beforeEach } from "vitest"
import { getCache, setCache, delCache, clearCache } from "@/lib/cache"

describe("cache", () => {
  beforeEach(async () => {
    await clearCache()
  })

  it("stores and retrieves values", async () => {
    await setCache("key1", { foo: "bar" })
    expect(await getCache("key1")).toEqual({ foo: "bar" })
  })

  it("returns undefined for missing keys", async () => {
    expect(await getCache("nonexistent")).toBeUndefined()
  })

  it("deletes values", async () => {
    await setCache("temp", "value")
    await delCache("temp")
    expect(await getCache("temp")).toBeUndefined()
  })

  it("clears all values", async () => {
    await setCache("a", 1)
    await setCache("b", 2)
    await clearCache()
    expect(await getCache("a")).toBeUndefined()
    expect(await getCache("b")).toBeUndefined()
  })

  it("stores with custom TTL", async () => {
    await setCache("fast", "gone", 0)
    await new Promise((r) => setTimeout(r, 10))
    expect(await getCache("fast")).toBeUndefined()
  })

  it("preserves value before TTL expiry", async () => {
    await setCache("keep", "alive", 60)
    expect(await getCache("keep")).toBe("alive")
  })

  it("handles complex data types", async () => {
    const data = { users: [{ id: 1, name: "Alice" }], count: 1 }
    await setCache("complex", data)
    expect(await getCache("complex")).toEqual(data)
  })
})
