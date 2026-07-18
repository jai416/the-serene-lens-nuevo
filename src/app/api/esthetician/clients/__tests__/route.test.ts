import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindUnique, mockFindMany, mockCount, mockCreate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
  mockCreate: vi.fn(),
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    clinic: { findUnique: mockFindUnique },
    client: {
      findMany: mockFindMany,
      count: mockCount,
      create: mockCreate,
    },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { getServerSession } from "next-auth"
import { GET, POST } from "../route"

describe("Esthetician Clients API", () => {
  const mockSession = { user: { id: "est-1", plan: "ESTHETICIAN" } }
  const mockClinic = { id: "clinic-1", ownerId: "est-1" }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns 401 without auth", async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const req = new Request("http://localhost/api/esthetician/clients")
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it("returns 403 for non-esthetician", async () => {
      ;(getServerSession as any).mockResolvedValue({ user: { id: "user-1", plan: "FREE" } })
      const req = new Request("http://localhost/api/esthetician/clients")
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it("returns empty list when clinic not found", async () => {
      mockFindUnique.mockResolvedValue(null)
      const req = new Request("http://localhost/api/esthetician/clients")
      const res = await GET(req)
      const body = await res.json()
      expect(body.data.clients).toEqual([])
    })

    it("returns paginated clients", async () => {
      mockFindUnique.mockResolvedValue(mockClinic)
      mockFindMany.mockResolvedValue([
        { id: "c1", name: "Ana", email: "ana@test.com", _count: { analyses: 3 } },
        { id: "c2", name: "Bob", email: "bob@test.com", _count: { analyses: 1 } },
      ])
      mockCount.mockResolvedValue(2)
      const req = new Request("http://localhost/api/esthetician/clients?page=1&limit=20")
      const res = await GET(req)
      const body = await res.json()
      expect(body.data.clients).toHaveLength(2)
      expect(body.data.total).toBe(2)
      expect(body.data.totalPages).toBe(1)
    })

    it("passes search parameter to query", async () => {
      mockFindUnique.mockResolvedValue(mockClinic)
      mockFindMany.mockResolvedValue([])
      mockCount.mockResolvedValue(0)
      const req = new Request("http://localhost/api/esthetician/clients?search=ana")
      await GET(req)
      const where = mockFindMany.mock.calls[0][0].where
      expect(where.OR).toBeDefined()
      expect(where.OR[0].name.contains).toBe("ana")
    })
  })

  describe("POST", () => {
    it("returns 401 without auth", async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const req = new Request("http://localhost/api/esthetician/clients", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it("returns 403 for non-esthetician", async () => {
      ;(getServerSession as any).mockResolvedValue({ user: { id: "user-1", plan: "FREE" } })
      const req = new Request("http://localhost/api/esthetician/clients", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it("creates client successfully", async () => {
      mockFindUnique.mockResolvedValue(mockClinic)
      mockCount.mockResolvedValue(5)
      mockCreate.mockResolvedValue({ id: "c1", name: "Ana", email: "ana@test.com" })
      const req = new Request("http://localhost/api/esthetician/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ana", email: "ana@test.com", phone: "+5351234567" }),
      })
      const res = await POST(req)
      const body = await res.json()
      expect(res.status).toBe(201)
      expect(body.data.client.name).toBe("Ana")
    })

    it("rejects when name is empty", async () => {
      mockFindUnique.mockResolvedValue(mockClinic)
      const req = new Request("http://localhost/api/esthetician/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it("rejects when over 200 client limit", async () => {
      mockFindUnique.mockResolvedValue(mockClinic)
      mockCount.mockResolvedValue(200)
      const req = new Request("http://localhost/api/esthetician/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ana" }),
      })
      const res = await POST(req)
      const body = await res.json()
      expect(body.error.message).toContain("200")
    })

    it("rejects when clinic not found", async () => {
      mockFindUnique.mockResolvedValue(null)
      const req = new Request("http://localhost/api/esthetician/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ana" }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})
