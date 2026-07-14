import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockGetActiveChallenges, mockCompleteChallenge, mockGetSession } = vi.hoisted(() => ({
  mockGetActiveChallenges: vi.fn(),
  mockCompleteChallenge: vi.fn(),
  mockGetSession: vi.fn(),
}))

vi.mock("next-auth", () => ({
  getServerSession: mockGetSession,
}))

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}))

vi.mock("@/lib/services/challenge.service", () => ({
  ChallengeService: {
    getActiveChallenges: mockGetActiveChallenges,
    completeChallenge: mockCompleteChallenge,
  },
  ChallengeError: class ChallengeError extends Error {
    code: string
    constructor(message: string, code: string) {
      super(message)
      this.code = code
    }
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { GET, POST } from "../route"

describe("Challenges API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetSession.mockResolvedValueOnce(null)
      const res = await GET()
      expect(res.status).toBe(401)
    })

    it("returns active challenges for authenticated user", async () => {
      mockGetSession.mockResolvedValueOnce({ user: { id: "user-1" } })
      mockGetActiveChallenges.mockResolvedValueOnce({
        challenges: [
          { id: "1", title: "Challenge 1", completed: false },
          { id: "2", title: "Challenge 2", completed: true },
        ],
      })

      const res = await GET()
      const body = await res.json()
      const data = body?.data || body

      expect(res.status).toBe(200)
      expect(data.challenges).toHaveLength(2)
    })

    it("returns 500 on service error", async () => {
      mockGetSession.mockResolvedValueOnce({ user: { id: "user-1" } })
      mockGetActiveChallenges.mockRejectedValueOnce(new Error("Service error"))

      const res = await GET()
      expect(res.status).toBe(500)
    })
  })

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetSession.mockResolvedValueOnce(null)
      const req = new Request("http://localhost/api/challenges", {
        method: "POST",
        body: JSON.stringify({ challengeId: "1" }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it("returns 400 for invalid body", async () => {
      mockGetSession.mockResolvedValueOnce({ user: { id: "user-1" } })
      const req = new Request("http://localhost/api/challenges", {
        method: "POST",
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it("completes challenge successfully", async () => {
      mockGetSession.mockResolvedValueOnce({ user: { id: "user-1" } })
      mockCompleteChallenge.mockResolvedValueOnce({ success: true })

      const req = new Request("http://localhost/api/challenges", {
        method: "POST",
        body: JSON.stringify({ challengeId: "challenge-1" }),
      })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body?.data?.success ?? body?.success).toBe(true)
    })
  })
})
