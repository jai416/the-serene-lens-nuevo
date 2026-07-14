import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindUnique, mockCreate, mockSendEmail, mockCheckRateLimit } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockSendEmail: vi.fn().mockResolvedValue(true),
  mockCheckRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 2 }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    leadMagnet: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}))

vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
  buildLeadMagnetEmail: vi.fn().mockReturnValue({ subject: "Test", html: "<p>test</p>" }),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

import { POST } from "../route"

describe("LeadMagnet API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for missing email", async () => {
    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toContain("Email inválido")
  })

  it("returns 400 for invalid email", async () => {
    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0 })
    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it("creates lead magnet and returns downloadUrl for new email", async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValueOnce({ id: "1", email: "test@example.com" })

    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.downloadUrl).toContain("skincare-tropical.pdf")
    expect(mockCreate).toHaveBeenCalledWith({ data: { email: "test@example.com" } })
    expect(mockSendEmail).toHaveBeenCalled()
  })

  it("does not create duplicate for existing email", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "1", email: "test@example.com" })

    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    })
    await POST(req)

    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns 500 on db error", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("DB error"))

    const req = new Request("http://localhost/api/lead-magnet", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
