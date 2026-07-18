import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindUnique, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    client: { findUnique: mockFindUnique, update: mockUpdate, delete: mockDelete },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { getServerSession } from "next-auth"
import { PATCH, DELETE } from "../route"

describe("Esthetician Client [id] API", () => {
  const mockSession = { user: { id: "est-1", plan: "ESTHETICIAN" } }
  const mockClient = { id: "c1", estheticianId: "est-1", name: "Ana", email: "ana@test.com" }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  describe("PATCH", () => {
    it("returns 401 without auth", async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const req = new Request("http://localhost/api/esthetician/clients/c1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: "c1" }) })
      expect(res.status).toBe(401)
    })

    it("returns 403 for non-esthetician", async () => {
      ;(getServerSession as any).mockResolvedValue({ user: { id: "u1", plan: "FREE" } })
      const req = new Request("http://localhost/api/esthetician/clients/c1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: "c1" }) })
      expect(res.status).toBe(403)
    })

    it("returns 404 if client not found", async () => {
      mockFindUnique.mockResolvedValue(null)
      const req = new Request("http://localhost/api/esthetician/clients/c1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: "c1" }) })
      expect(res.status).toBe(404)
    })

    it("returns 403 if client belongs to another esthetician", async () => {
      mockFindUnique.mockResolvedValue({ id: "c1", estheticianId: "other-est", name: "Ana" })
      const req = new Request("http://localhost/api/esthetician/clients/c1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: "c1" }) })
      expect(res.status).toBe(403)
    })

    it("updates client successfully", async () => {
      mockFindUnique.mockResolvedValue(mockClient)
      mockUpdate.mockResolvedValue({ ...mockClient, name: "Updated" })
      const req = new Request("http://localhost/api/esthetician/clients/c1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated", email: "new@email.com" }),
      })
      const res = await PATCH(req, { params: Promise.resolve({ id: "c1" }) })
      const body = await res.json()
      expect(body.data.client.name).toBe("Updated")
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { name: "Updated", email: "new@email.com" },
      })
    })
  })

  describe("DELETE", () => {
    it("deletes client successfully", async () => {
      mockFindUnique.mockResolvedValue(mockClient)
      mockDelete.mockResolvedValue(mockClient)
      const req = new Request("http://localhost/api/esthetician/clients/c1", { method: "DELETE" })
      const res = await DELETE(req, { params: Promise.resolve({ id: "c1" }) })
      const body = await res.json()
      expect(body.data.deleted).toBe(true)
    })

    it("returns 404 if client not found", async () => {
      mockFindUnique.mockResolvedValue(null)
      const req = new Request("http://localhost/api/esthetician/clients/c1", { method: "DELETE" })
      const res = await DELETE(req, { params: Promise.resolve({ id: "c1" }) })
      expect(res.status).toBe(404)
    })
  })
})
