import { describe, it, expect, vi, beforeEach } from "vitest"

const {
  mockFindMany,
  mockCreate,
  mockCount,
  mockUpsert,
  mockFindUnique,
  mockLoggerInfo,
  mockLoggerError,
  mockLoggerWarn,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockCount: vi.fn(),
  mockUpsert: vi.fn(),
  mockFindUnique: vi.fn(),
  mockLoggerInfo: vi.fn(),
  mockLoggerError: vi.fn(),
  mockLoggerWarn: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    user: { findMany: mockFindMany },
    emailLog: { create: mockCreate, findMany: mockFindMany, count: mockCount },
    unsubscribe: { findMany: mockFindMany, upsert: mockUpsert, findUnique: mockFindUnique },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: mockLoggerWarn,
    debug: vi.fn(),
  },
}))

// Mock resend
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null }) },
    batch: { send: vi.fn().mockResolvedValue({ data: null, error: null }) },
  })),
}))

import { sendEmail, sendBulkEmail, getRecipients, getRecipientCounts } from "../admin-email.service"

describe("admin-email.service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = "test-key"
    // Reset the cached resend client by re-importing would be complex
    // Instead, we test the "no API key" case first
  })

  describe("sendEmail", () => {
    it("returns console-log when no API key", async () => {
      const original = process.env.RESEND_API_KEY
      delete process.env.RESEND_API_KEY

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
      })

      expect(result.id).toBe("console-log")

      process.env.RESEND_API_KEY = original
    })

    it("sends a single email successfully", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
      })

      expect(result.id).toBeDefined()
    })
  })

  describe("sendBulkEmail", () => {
    it("sends bulk emails to multiple recipients", async () => {
      mockCreate.mockResolvedValue({})

      const result = await sendBulkEmail({
        subject: "Newsletter",
        html: "<p>Content</p>",
        segment: "all",
        recipients: [
          { email: "a@test.com", name: "Alice" },
          { email: "b@test.com", name: "Bob" },
        ],
      })

      expect(result.sent).toBe(2)
      expect(result.failed).toBe(0)
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })

    it("returns console counts when no API key", async () => {
      delete process.env.RESEND_API_KEY

      const result = await sendBulkEmail({
        subject: "Test",
        html: "<p>Hi</p>",
        segment: "free",
        recipients: [{ email: "a@test.com" }],
      })

      expect(result.sent).toBe(1)
      expect(result.failed).toBe(0)
    })
  })

  describe("getRecipients", () => {
    it("filters out unsubscribed users", async () => {
      mockFindMany
        .mockResolvedValueOnce([{ email: "unsub@test.com" }])  // unsubscribes
        .mockResolvedValueOnce([                                  // users
          { email: "active@test.com", name: "Active" },
          { email: "unsub@test.com", name: "Unsub" },
        ])

      const result = await getRecipients("all")

      expect(result).toHaveLength(1)
      expect(result[0].email).toBe("active@test.com")
    })

    it("filters by plan for free segment", async () => {
      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { email: "free@test.com", name: "Free", plan: "FREE" },
        ])

      const result = await getRecipients("free")

      expect(result).toHaveLength(1)
      expect(result[0].email).toBe("free@test.com")
    })
  })

  describe("getRecipientCounts", () => {
    it("returns counts for all segments", async () => {
      mockFindMany
        .mockResolvedValueOnce([])  // unsubscribes
        .mockResolvedValueOnce([    // users
          { email: "a@test.com", plan: "FREE", analysisUsed: 0, createdAt: new Date() },
          { email: "b@test.com", plan: "PREMIUM", analysisUsed: 5, createdAt: new Date() },
          { email: "c@test.com", plan: "PRO", analysisUsed: 10, createdAt: new Date() },
        ])

      const counts = await getRecipientCounts()

      expect(counts.all).toBe(3)
      expect(counts.free).toBe(1)
      expect(counts.premium).toBe(1)
      expect(counts.pro).toBe(1)
      expect(counts.active).toBe(2)
      expect(counts.inactive).toBe(1)
    })
  })
})
