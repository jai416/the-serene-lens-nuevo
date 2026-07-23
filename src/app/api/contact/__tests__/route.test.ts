import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockCreate, mockSendEmail, mockCheckRateLimit } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockSendEmail: vi.fn().mockResolvedValue(true),
  mockCheckRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4 }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    contactMessage: {
      create: mockCreate,
    },
  },
}))

vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/csrf-middleware", () => ({
  validateCsrf: vi.fn(() => true),
}))

import { POST } from "../route"

describe("Contact API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for missing fields", async () => {
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid email", async () => {
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      body: JSON.stringify({ name: "Test", email: "bad", subject: "Test", message: "Test" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0 })
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      body: JSON.stringify({ name: "Test", email: "test@example.com", subject: "Test", message: "Test" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it("creates contact message and returns success", async () => {
    mockCreate.mockResolvedValueOnce({ id: "1" })

    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      body: JSON.stringify({ name: "Test User", email: "test@example.com", subject: "Test Subject", message: "This is a test message" }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockCreate).toHaveBeenCalled()
  })

  it("returns 500 on db error", async () => {
    mockCreate.mockRejectedValueOnce(new Error("DB error"))

    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      body: JSON.stringify({ name: "Test", email: "test@example.com", subject: "Test", message: "Test" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
