import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindUnique, mockFindFirst, mockCreate, mockDiscountFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockDiscountFindUnique: vi.fn(),
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    clinic: { findUnique: mockFindUnique },
    discountCode: { findFirst: mockFindFirst, findUnique: mockDiscountFindUnique, create: mockCreate },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { getServerSession } from "next-auth"
import { GET, POST } from "../route"

describe("Esthetician Marketing API", () => {
  const mockSession = { user: { id: "est-1", plan: "ESTHETICIAN" } }
  const mockClinic = { id: "clinic-1", ownerId: "est-1", name: "Mi Clínica", referralCode: "EST-ABC123" }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDiscountFindUnique.mockReset()
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns 401 without auth", async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const res = await GET()
      expect(res.status).toBe(401)
    })

    it("returns 403 for non-esthetician", async () => {
      ;(getServerSession as any).mockResolvedValue({ user: { id: "u1", plan: "FREE" } })
      const res = await GET()
      expect(res.status).toBe(403)
    })

    it("returns clinic info and referred users count", async () => {
      mockFindUnique.mockResolvedValue({ ...mockClinic, _count: { referredUsers: 5 } })
      mockFindFirst.mockResolvedValue({ code: "EST-ABC123", discount: 20 })
      const res = await GET()
      const body = await res.json()
      expect(body.data.clinic.name).toBe("Mi Clínica")
      expect(body.data.clinic.referralCode).toBe("EST-ABC123")
      expect(body.data.clinic.referredUsers).toBe(5)
      expect(body.data.discountCode.code).toBe("EST-ABC123")
    })

    it("returns null discount code when not yet generated", async () => {
      mockFindUnique.mockResolvedValue({ ...mockClinic, _count: { referredUsers: 0 } })
      mockFindFirst.mockResolvedValue(null)
      const res = await GET()
      const body = await res.json()
      expect(body.data.discountCode).toBeNull()
    })
  })

  describe("POST", () => {
    it("generates discount code successfully", async () => {
      mockFindUnique.mockResolvedValue(mockClinic)
      mockCreate.mockResolvedValue({ code: "EST-ABC123", discount: 20, maxUses: 50 })
      const res = await POST()
      const body = await res.json()
      expect(res.status).toBe(201)
      expect(body.data.discountCode.code).toBe("EST-ABC123")
      expect(body.data.discountCode.discount).toBe(20)
    })

    it("returns existing code if already generated", async () => {
      mockFindUnique.mockResolvedValue(mockClinic)
      mockDiscountFindUnique.mockResolvedValue({ code: "EST-ABC123", discount: 20 })
      const res = await POST()
      const body = await res.json()
      expect(body.data.discountCode.discount).toBe(20)
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it("returns 403 for non-esthetician", async () => {
      ;(getServerSession as any).mockResolvedValue({ user: { id: "u1", plan: "FREE" } })
      const res = await POST()
      expect(res.status).toBe(403)
    })
  })
})
