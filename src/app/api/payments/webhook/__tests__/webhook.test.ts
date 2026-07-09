import { describe, it, expect, vi, beforeEach } from "vitest"

const {
  mockFindUnique,
  mockfindFirst,
  mockUpdate,
  mockCreate,
  mockQvaPayStatus,
  mockGetCUPRate,
  mockCheckRateLimit,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockfindFirst: vi.fn().mockResolvedValue(null),
  mockUpdate: vi.fn(),
  mockCreate: vi.fn(),
  mockQvaPayStatus: vi.fn(),
  mockGetCUPRate: vi.fn(),
  mockCheckRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29 }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    payment: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    digitalProductPurchase: {
      findFirst: mockfindFirst,
      update: mockUpdate,
    },
    purchasePack: {
      create: mockCreate,
    },
    user: {
      update: mockUpdate,
    },
    subscription: {
      create: mockCreate,
    },
    webhookEvent: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    },
  },
}))

vi.mock("@/lib/payments", () => ({
  getQvaPayPaymentStatus: mockQvaPayStatus,
}))

vi.mock("@/lib/cup-rate", () => ({
  getCUPRate: mockGetCUPRate,
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}))

import { POST } from "@/app/api/payments/webhook/route"

function createRequest(body: any, headers?: Record<string, string>) {
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as any
}

describe("Webhook Processor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCUPRate.mockResolvedValue(500)
  })

  it("returns error when no transaction_uuid", async () => {
    const req = createRequest({})
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.code).toBe("VALIDATION_ERROR")
  })

  it("returns error when transaction_uuid is not a string", async () => {
    const req = createRequest({ transaction_uuid: 12345 })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.code).toBe("VALIDATION_ERROR")
  })

  it("returns error when payment not found", async () => {
    mockFindUnique.mockResolvedValue(null)
    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.message).toBe("Pago no encontrado")
  })

  it("returns already completed if payment already processed", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", status: "completed", user: {} })
    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
  })

  it("returns error when QvaPay verification fails", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", status: "pending", user: {} })
    mockQvaPayStatus.mockRejectedValue(new Error("Network error"))
    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.message).toBe("No se pudo verificar el pago con QvaPay")
  })

  it("returns unverified if QvaPay status is not paid", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", status: "pending", user: {} })
    mockQvaPayStatus.mockResolvedValue({ status: "pending" })
    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.verified).toBe(false)
  })

  it("returns unverified if QvaPay status is empty", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", status: "pending", user: {} })
    mockQvaPayStatus.mockResolvedValue({})
    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.verified).toBe(false)
  })

  it("reads status from data.status (nested format)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "BASIC", amount: 1.99, userId: "u1", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ data: { status: "paid" } })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it("processes successful BASIC pack payment (3 analyses)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "BASIC", amount: 1.99, userId: "user-1", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "paid" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        packType: "BASIC",
        analyses: 3,
        status: "completed",
      }),
    })
  })

  it("processes successful POPULAR pack payment (5 analyses)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "POPULAR", amount: 4.99, userId: "user-1", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "paid" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        packType: "POPULAR",
        analyses: 5,
      }),
    })
  })

  it("processes successful ADVANCED pack payment (15 analyses)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "ADVANCED", amount: 6.99, userId: "user-1", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "paid" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        packType: "ADVANCED",
        analyses: 15,
      }),
    })
  })

  it("processes successful PREMIUM subscription", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "PREMIUM", amount: 4.99, userId: "user-1", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "completed" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { plan: "PREMIUM" },
    })
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        plan: "PREMIUM",
        status: "active",
        provider: "qvapay",
      }),
    })
  })

  it("processes successful PRO subscription", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "PRO", amount: 9.99, userId: "user-2", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "paid" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "def-456" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { plan: "PRO" },
    })
  })

  it("processes successful PRO_PLUS subscription", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "PRO_PLUS", amount: 14.99, userId: "user-3", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "paid" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "ghi-789" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-3" },
      data: { plan: "PRO_PLUS" },
    })
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        plan: "PRO_PLUS",
        status: "active",
      }),
    })
  })

  it("handles payment with no plan (skips pack/subscription)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: null, amount: 1.0, userId: "user-4", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "paid" })
    mockUpdate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "no-plan-001" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("handles v2 webhook format with payment_id", async () => {
    mockFindUnique.mockResolvedValue(null)
    const req = createRequest({ payment_id: "xyz-789" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.message).toBe("Pago no encontrado")
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { qvapayId: "xyz-789" },
      include: { user: true },
    })
  })

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0 })
    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error?.message).toBe("Demasiadas solicitudes")
  })

  it("calculates CUP amount correctly for packs", async () => {
    mockGetCUPRate.mockResolvedValue(500)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "BASIC", amount: 1.99, userId: "user-1", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "paid" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "abc-123" })
    await POST(req)

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amountUsd: 1.99,
        amountCup: 1.99 * 500,
      }),
    })
  })

  it("sets subscription period end to 30 days", async () => {
    const now = new Date()
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "PREMIUM", amount: 4.99, userId: "user-1", user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "paid" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "abc-123" })
    await POST(req)

    const createCall = mockCreate.mock.calls[0][0]
    const periodEnd = createCall.data.currentPeriodEnd
    const diffDays = Math.round((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(30)
  })
})
