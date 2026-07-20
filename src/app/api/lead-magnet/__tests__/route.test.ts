import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockCreate, mockFindUnique, mockCheckRateLimit } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCheckRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 2 }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    leadMagnet: { create: mockCreate, findUnique: mockFindUnique },
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

import { POST } from "../route"

describe("Lead Magnet API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for missing email", async () => {
    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it("returns 400 for invalid email", async () => {
    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("creates lead and returns download url", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: "lead-1", email: "test@test.com" })
    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.downloadUrl).toContain("skincare-tropical")
    expect(mockCreate).toHaveBeenCalled()
  })

  it("skips create for existing email", async () => {
    mockFindUnique.mockResolvedValue({ id: "lead-1", email: "test@test.com" })
    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("rejects when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0 })
    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})
