import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockTransaction, mockUpsert, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
  mockUpsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mockTransaction,
    rateLimit: { findUnique: vi.fn(), upsert: mockUpsert, update: mockUpdate, delete: mockDelete, deleteMany: vi.fn() },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { checkRateLimit, clearRateLimit, cleanupExpiredRateLimits } from "@/lib/rate-limit"

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("allows first request and creates record", async () => {
    mockTransaction.mockImplementation(async (cb: any) => {
      return cb({
        rateLimit: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: mockUpsert,
        },
      })
    })
    mockUpsert.mockResolvedValue({ count: 1 })
    const result = await checkRateLimit("key-1", 10, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it("allows request within limit", async () => {
    mockTransaction.mockImplementation(async (cb: any) => {
      return cb({
        rateLimit: {
          findUnique: vi.fn().mockResolvedValue({ key: "key-1", count: 3, resetAt: new Date(Date.now() + 60000) }),
          update: mockUpdate,
        },
      })
    })
    const result = await checkRateLimit("key-1", 10, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(6)
  })

  it("blocks request when over limit", async () => {
    mockTransaction.mockImplementation(async (cb: any) => {
      return cb({
        rateLimit: {
          findUnique: vi.fn().mockResolvedValue({ key: "key-1", count: 10, resetAt: new Date(Date.now() + 60000) }),
        },
      })
    })
    const result = await checkRateLimit("key-1", 10, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("resets count when window expired", async () => {
    mockTransaction.mockImplementation(async (cb: any) => {
      return cb({
        rateLimit: {
          findUnique: vi.fn().mockResolvedValue({ key: "key-1", count: 10, resetAt: new Date(Date.now() - 1000) }),
          upsert: mockUpsert,
        },
      })
    })
    mockUpsert.mockResolvedValue({ count: 1 })
    const result = await checkRateLimit("key-1", 10, 60000)
    expect(result.allowed).toBe(true)
  })
})

describe("clearRateLimit", () => {
  it("deletes the rate limit record", async () => {
    await clearRateLimit("key-1")
    expect(mockDelete).toHaveBeenCalledWith({ where: { key: "key-1" } })
  })

  it("handles delete error gracefully", async () => {
    mockDelete.mockRejectedValueOnce(new Error("Not found"))
    await expect(clearRateLimit("bad-key")).resolves.not.toThrow()
  })
})
