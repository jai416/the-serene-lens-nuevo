import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    clinic: { findUnique: mockFindUnique },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { getServerSession } from "next-auth"
import { GET } from "../route"

describe("Esthetician Referred API", () => {
  const mockSession = { user: { id: "est-1", plan: "ESTHETICIAN" } }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

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

  it("returns referred users with count", async () => {
    const mockUsers = [
      { id: "u1", name: "Ana", email: "ana@test.com", createdAt: new Date(), plan: "PREMIUM" },
      { id: "u2", name: "Bob", email: "bob@test.com", createdAt: new Date(), plan: "FREE" },
    ]
    mockFindUnique.mockResolvedValue({
      id: "clinic-1",
      _count: { referredUsers: 2 },
      referredUsers: mockUsers,
    })
    const res = await GET()
    const body = await res.json()
    expect(body.data.total).toBe(2)
    expect(body.data.users).toHaveLength(2)
    expect(body.data.users[0].name).toBe("Ana")
  })

  it("returns 0 total when clinic not found", async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await GET()
    const body = await res.json()
    expect(body.data.total).toBe(0)
    expect(body.data.users).toEqual([])
  })
})
