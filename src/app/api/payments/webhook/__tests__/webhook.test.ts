import { describe, it, expect, vi, beforeEach } from "vitest"

const {
  mockFindUnique,
  mockFindFirst,
  mockUpdate,
  mockCreate,
  mockPayPalStatus,
  mockGetCUPRate,
  mockCheckRateLimit,
  mockTransaction,
  mockWebhookFindFirst,
  mockWebhookCreate,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn().mockResolvedValue(null),
  mockUpdate: vi.fn(),
  mockCreate: vi.fn(),
  mockPayPalStatus: vi.fn(),
  mockGetCUPRate: vi.fn(),
  mockCheckRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29 }),
  mockTransaction: vi.fn(async (cb: any) => cb({
    payment: { update: mockUpdate },
    purchasePack: { create: mockCreate },
    user: { update: mockUpdate },
    subscription: { create: mockCreate },
    webhookEvent: { create: mockWebhookCreate },
  })),
  mockWebhookFindFirst: vi.fn().mockResolvedValue(null),
  mockWebhookCreate: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    payment: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    digitalProductPurchase: {
      findFirst: mockFindFirst,
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
      findFirst: mockWebhookFindFirst,
      create: mockWebhookCreate,
    },
    $transaction: mockTransaction,
  },
}))

vi.mock("@/lib/paypal", () => ({
  verifyPayPalOrder: mockPayPalStatus,
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
    mockFindFirst.mockResolvedValue(null)
  })

  it("returns error when no orderId", async () => {
    const req = createRequest({})
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.code).toBe("VALIDATION_ERROR")
  })

  it("returns error when orderId is not a string", async () => {
    const req = createRequest({ id: 12345 })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.code).toBe("VALIDATION_ERROR")
  })

  it("reads orderId from body.eventType", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockFindFirst.mockResolvedValue(null)
    const req = createRequest({ eventType: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.message).toBe("Pago no encontrado")
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { paypalOrderId: "abc-123" },
      include: { user: true },
    })
  })

  it("reads orderId from body.id", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockFindFirst.mockResolvedValue(null)
    const req = createRequest({ id: "xyz-789" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.message).toBe("Pago no encontrado")
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { paypalOrderId: "xyz-789" },
      include: { user: true },
    })
  })

  it("returns duplicate when already processed", async () => {
    mockWebhookFindFirst.mockResolvedValueOnce({ id: "e1" })
    const req = createRequest({ id: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.duplicate).toBe(true)
  })

  it("returns error when payment not found", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockFindFirst.mockResolvedValue(null)
    const req = createRequest({ id: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.message).toBe("Pago no encontrado")
  })

  it("returns already completed if payment already processed", async () => {
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({ id: "p1", status: "completed", user: {} })
    const req = createRequest({ id: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(data.data?.type).toBe("plan")
  })

  it("processes guide purchase", async () => {
    mockFindFirst.mockResolvedValue({
      id: "g1",
      status: "pending",
      userId: "u1",
      digitalProduct: { fileUrl: "/guides/test.pdf" },
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 2.99 })
    mockUpdate.mockResolvedValue({})

    const req = createRequest({ eventType: "guide-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.type).toBe("guide")
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "g1" },
      data: { status: "completed", downloadUrl: "/guides/test.pdf" },
    })
  })

  it("returns already completed guide purchase", async () => {
    mockFindFirst.mockResolvedValue({
      id: "g1",
      status: "completed",
      userId: "u1",
      digitalProduct: null,
    })
    const req = createRequest({ id: "guide-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.type).toBe("guide")
  })

  it("returns error when PayPal verification fails for guide", async () => {
    mockFindFirst.mockResolvedValue({
      id: "g1",
      status: "pending",
      userId: "u1",
      digitalProduct: null,
    })
    mockPayPalStatus.mockRejectedValue(new Error("Network error"))
    const req = createRequest({ id: "guide-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.message).toBe("No se pudo verificar el pago con PayPal")
  })

  it("returns unverified if PayPal status is not completed for guide", async () => {
    mockFindFirst.mockResolvedValue({
      id: "g1",
      status: "pending",
      userId: "u1",
      digitalProduct: null,
    })
    mockPayPalStatus.mockResolvedValue({ status: "PENDING", amount: 2.99 })
    const req = createRequest({ id: "guide-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.verified).toBe(false)
  })

  it("returns unverified if PayPal status is not COMPLETED for plan", async () => {
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({ id: "p1", status: "pending", plan: "PREMIUM", amount: 4.99, userId: "u1", user: {} })
    mockPayPalStatus.mockResolvedValue({ status: "PENDING", amount: 4.99 })
    const req = createRequest({ id: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.verified).toBe(false)
  })

  it("processes successful BASIC pack payment (3 analyses)", async () => {
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "BASIC", amount: 1.99, userId: "user-1", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 1.99 })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ id: "abc-123" })
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
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "POPULAR", amount: 4.99, userId: "user-1", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 4.99 })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ id: "abc-123" })
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
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "ADVANCED", amount: 6.99, userId: "user-1", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 6.99 })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ id: "abc-123" })
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
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "PREMIUM", amount: 4.99, userId: "user-1", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 4.99 })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ id: "abc-123" })
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
        provider: "paypal",
      }),
    })
  })

  it("processes successful PRO subscription", async () => {
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "PRO", amount: 9.99, userId: "user-2", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 9.99 })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ id: "def-456" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { plan: "PRO" },
    })
  })

  it("processes successful PRO_PLUS subscription", async () => {
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "PRO_PLUS", amount: 14.99, userId: "user-3", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 14.99 })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ id: "ghi-789" })
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
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: null, amount: 1.0, userId: "user-4", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 1.0 })
    mockUpdate.mockResolvedValue({})

    const req = createRequest({ id: "no-plan-001" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0 })
    const req = createRequest({ id: "abc-123" })
    const res = await POST(req)
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error?.message).toBe("Demasiadas solicitudes")
  })

  it("calculates CUP amount correctly for packs", async () => {
    mockGetCUPRate.mockResolvedValue(500)
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "BASIC", amount: 1.99, userId: "user-1", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 1.99 })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ id: "abc-123" })
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
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "PREMIUM", amount: 4.99, userId: "user-1", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 4.99 })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ id: "abc-123" })
    await POST(req)

    const createCall = mockCreate.mock.calls.find((c: any[]) => c[0]?.data?.currentPeriodEnd)
    expect(createCall).toBeDefined()
    const periodEnd = createCall[0].data.currentPeriodEnd
    const diffDays = Math.round((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(30)
  })

  it("sets subscription period end to 365 days for annual plans", async () => {
    const now = new Date()
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue({
      id: "p1", status: "pending", plan: "PREMIUM_ANNUAL", amount: 79.99, userId: "user-1", user: {},
    })
    mockPayPalStatus.mockResolvedValue({ status: "COMPLETED", amount: 79.99 })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ id: "abc-123" })
    await POST(req)

    const createCall = mockCreate.mock.calls.find((c: any[]) => c[0]?.data?.currentPeriodEnd)
    expect(createCall).toBeDefined()
    const periodEnd = createCall[0].data.currentPeriodEnd
    const diffDays = Math.round((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(365)
  })
})
