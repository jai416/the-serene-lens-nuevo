import { describe, it, expect, vi, beforeEach } from "vitest"

const {
  mockFindUnique,
  mockUpdate,
  mockCreate,
  mockQvaPayStatus,
  mockGetCUPRate,
  mockCheckRateLimit,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
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
    purchasePack: {
      create: mockCreate,
    },
    user: {
      update: mockUpdate,
    },
    subscription: {
      create: mockCreate,
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

// We need to test the webhook route handler directly
// Import the POST function from the webhook route
import { POST } from "@/app/api/payments/webhook/route"

function createRequest(body: any) {
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  it("processes successful pack payment", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1",
      status: "pending",
      plan: "BASIC",
      amount: 1.99,
      userId: "user-1",
      user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "paid" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockCreate).toHaveBeenCalled()
  })

  it("processes successful subscription payment", async () => {
    mockFindUnique.mockResolvedValue({
      id: "p1",
      status: "pending",
      plan: "PREMIUM",
      amount: 4.99,
      userId: "user-1",
      user: {},
    })
    mockQvaPayStatus.mockResolvedValue({ status: "completed" })
    mockUpdate.mockResolvedValue({})
    mockCreate.mockResolvedValue({})

    const req = createRequest({ transaction_uuid: "abc-123" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.data?.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockCreate).toHaveBeenCalled()
  })

  it("handles v2 webhook format with payment_id", async () => {
    mockFindUnique.mockResolvedValue(null)
    const req = createRequest({ payment_id: "xyz-789" })
    const res = await POST(req)
    const data = await res.json()
    expect(data.error?.message).toBe("Pago no encontrado")
    // Verify it tried to look up by qvapayId
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { qvapayId: "xyz-789" },
      include: { user: true },
    })
  })
})
