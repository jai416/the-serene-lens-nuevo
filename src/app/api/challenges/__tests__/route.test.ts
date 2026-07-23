import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockGetActive, mockComplete } = vi.hoisted(() => ({
  mockGetActive: vi.fn(),
  mockComplete: vi.fn(),
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("@/lib/services/challenge.service", () => ({
  ChallengeService: {
    getActiveChallenges: mockGetActive,
    completeChallenge: mockComplete,
  },
  ChallengeError: class ChallengeError extends Error {
    code: string
    constructor(message: string, code: string) {
      super(message)
      this.code = code
    }
  },
}))

vi.mock("@/lib/csrf-middleware", () => ({
  validateCsrf: vi.fn(() => true),
}))

vi.mock("@/lib/validations", () => ({
  challengeCompleteSchema: {
    safeParse: vi.fn().mockReturnValue({ success: true, data: { challengeId: "ch-1" } }),
  },
}))

import { getServerSession } from "next-auth"
import { GET, POST } from "../route"

describe("Challenges API", () => {
  const mockSession = { user: { id: "user-1" } }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns list of challenges", async () => {
      mockGetActive.mockResolvedValue({
        challenges: [{ id: "ch-1", title: "30 days of SPF", category: "PROTECTION" }],
        userProgress: [],
      })
      const res = await GET()
      const body = await res.json()
      expect(body.data.challenges).toHaveLength(1)
    })

    it("returns 401 without auth", async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const res = await GET()
      expect(res.status).toBe(401)
    })
  })

  describe("POST", () => {
    it("completes a challenge", async () => {
      mockComplete.mockResolvedValue({ success: true })
      const req = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: "ch-1" }),
      })
      const res = await POST(req)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it("returns 400 for invalid body", async () => {
      const mockSchema = await import("@/lib/validations")
      ;(mockSchema.challengeCompleteSchema.safeParse as any).mockReturnValueOnce({
        success: false,
        error: { issues: [{ message: "Invalid" }] },
      })
      const req = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})
