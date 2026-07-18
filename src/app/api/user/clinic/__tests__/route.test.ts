import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindUnique, mockCreate, mockUpdate, mockAnalysisFindMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockAnalysisFindMany: vi.fn().mockResolvedValue([]),
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    clinic: { findUnique: mockFindUnique, create: mockCreate, update: mockUpdate },
    skinAnalysis: { findMany: mockAnalysisFindMany },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { getServerSession } from "next-auth"
import { GET, PUT } from "../route"

describe("Clinic API", () => {
  const mockSession = { user: { id: "user-1", plan: "PREMIUM" } }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns 401 without auth", async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const res = await GET()
      expect(res.status).toBe(401)
    })

    it("returns clinic and analyses", async () => {
      mockFindUnique.mockResolvedValue({ id: "clinic-1", name: "Mi Clínica" })
      const res = await GET()
      const body = await res.json()
      expect(body.data.clinic.name).toBe("Mi Clínica")
    })
  })

  describe("PUT", () => {
    it("creates clinic with referral code when none exists", async () => {
      mockFindUnique.mockResolvedValue(null)
      mockCreate.mockResolvedValue({ id: "clinic-1", name: "Mi Clínica", referralCode: "EST-ABC123" })
      const req = new Request("http://localhost/api/user/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mi Clínica" }),
      })
      const res = await PUT(req)
      const body = await res.json()
      expect(body.data.clinic.referralCode).toMatch(/^EST-/)
    })

    it("updates existing clinic", async () => {
      mockFindUnique.mockResolvedValue({ id: "clinic-1", name: "Old" })
      mockUpdate.mockResolvedValue({ id: "clinic-1", name: "New Name" })
      const req = new Request("http://localhost/api/user/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      })
      const res = await PUT(req)
      const body = await res.json()
      expect(body.data.clinic.name).toBe("New Name")
    })
  })
})
