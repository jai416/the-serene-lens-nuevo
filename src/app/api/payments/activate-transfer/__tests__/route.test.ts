import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockTransaction, mockFindUnique, mockCreate, mockUpdateMany } = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdateMany: vi.fn(),
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mockTransaction,
    transferPayment: { findUnique: mockFindUnique, updateMany: mockUpdateMany },
    user: { update: vi.fn() },
    subscription: { create: vi.fn() },
    payment: { create: vi.fn() },
    auditLog: { create: mockCreate },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

vi.mock("@/lib/csrf-middleware", () => ({
  validateCsrf: vi.fn().mockReturnValue(true),
}))

import { getServerSession } from "next-auth"
import { POST } from "../route"

describe("Activate Transfer API", () => {
  const mockSession = { user: { id: "admin-1", role: "ADMIN" } }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  it("returns 401 without auth", async () => {
    ;(getServerSession as any).mockResolvedValue(null)
    const req = new Request("http://localhost/api/payments/activate-transfer", {
      method: "POST",
      body: JSON.stringify({ referenceCode: "T123" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("returns 403 for non-admin", async () => {
    ;(getServerSession as any).mockResolvedValue({ user: { id: "u1", role: "USER" } })
    const req = new Request("http://localhost/api/payments/activate-transfer", {
      method: "POST",
      body: JSON.stringify({ referenceCode: "T123" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it("activates validated transfer successfully", async () => {
    const mockTransfer = {
      id: "t1",
      referenceCode: "T123",
      status: "validated",
      amount: 10,
      userId: "u1",
      plan: "PREMIUM",
      user: { id: "u1" },
    }
    mockFindUnique.mockResolvedValue(mockTransfer)
    mockUpdateMany.mockResolvedValue({ count: 1 })
    mockTransaction.mockImplementation(async (cb: any) => {
      return cb({
        transferPayment: { updateMany: mockUpdateMany },
        user: { update: vi.fn() },
        subscription: { create: vi.fn() },
        payment: { create: vi.fn() },
        auditLog: { create: vi.fn() },
      })
    })
    const req = new Request("http://localhost/api/payments/activate-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceCode: "T123" }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.data.message).toBe("Acceso activado correctamente")
  })

  it("rejects if transfer not validated", async () => {
    mockFindUnique.mockResolvedValue({
      id: "t1",
      referenceCode: "T123",
      status: "pending",
      plan: "PREMIUM",
      user: { id: "u1" },
    })
    const req = new Request("http://localhost/api/payments/activate-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceCode: "T123" }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.error.message).toContain("validada")
  })
})
