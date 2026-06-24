import { describe, it, expect, vi, beforeEach } from "vitest"

const {
  mockChallengeFindMany,
  mockChallengeFindUnique,
  mockChallengeCreate,
  mockChallengeUpdate,
  mockChallengeCount,
  mockUserChallengeFindMany,
  mockUserChallengeFindUnique,
  mockUserChallengeUpsert,
  mockUserChallengeCount,
} = vi.hoisted(() => ({
  mockChallengeFindMany: vi.fn(),
  mockChallengeFindUnique: vi.fn(),
  mockChallengeCreate: vi.fn(),
  mockChallengeUpdate: vi.fn(),
  mockChallengeCount: vi.fn(),
  mockUserChallengeFindMany: vi.fn(),
  mockUserChallengeFindUnique: vi.fn(),
  mockUserChallengeUpsert: vi.fn(),
  mockUserChallengeCount: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    challenge: {
      findMany: mockChallengeFindMany,
      findUnique: mockChallengeFindUnique,
      create: mockChallengeCreate,
      update: mockChallengeUpdate,
      count: mockChallengeCount,
    },
    userChallenge: {
      findMany: mockUserChallengeFindMany,
      findUnique: mockUserChallengeFindUnique,
      upsert: mockUserChallengeUpsert,
      count: mockUserChallengeCount,
    },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { ChallengeService } from "../challenge.service"

describe("ChallengeService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getActiveChallenges", () => {
    it("returns challenges with user completion status", async () => {
      const mockChallenges = [
        {
          id: "c1",
          title: "Challenge 1",
          description: "Desc",
          points: 10,
          frequency: "weekly",
          userChallenges: [{ completed: true, completedAt: new Date() }],
        },
        {
          id: "c2",
          title: "Challenge 2",
          description: "Desc 2",
          points: 20,
          frequency: "daily",
          userChallenges: [],
        },
      ]
      mockChallengeFindMany.mockResolvedValue(mockChallenges)
      mockUserChallengeFindMany.mockResolvedValue([
        { challenge: { points: 10 } },
      ])

      const result = await ChallengeService.getActiveChallenges("user-1")

      expect(result.challenges).toHaveLength(2)
      expect(result.challenges[0].completed).toBe(true)
      expect(result.challenges[1].completed).toBe(false)
      expect(result.totalPoints).toBe(10)
    })

    it("returns empty array when no active challenges", async () => {
      mockChallengeFindMany.mockResolvedValue([])
      mockUserChallengeFindMany.mockResolvedValue([])

      const result = await ChallengeService.getActiveChallenges("user-1")
      expect(result.challenges).toEqual([])
      expect(result.totalPoints).toBe(0)
    })
  })

  describe("completeChallenge", () => {
    it("completes a challenge and returns points", async () => {
      mockChallengeFindUnique.mockResolvedValue({
        id: "c1",
        title: "Test",
        points: 15,
        active: true,
      })
      mockUserChallengeFindUnique.mockResolvedValue(null)
      mockUserChallengeUpsert.mockResolvedValue({
        id: "uc1",
        completed: true,
        completedAt: new Date(),
      })

      const result = await ChallengeService.completeChallenge("user-1", "c1")

      expect(result.pointsEarned).toBe(15)
      expect(mockUserChallengeUpsert).toHaveBeenCalled()
    })

    it("throws NOT_FOUND for nonexistent challenge", async () => {
      mockChallengeFindUnique.mockResolvedValue(null)

      await expect(
        ChallengeService.completeChallenge("user-1", "missing")
      ).rejects.toThrow("Desafío no encontrado")
    })

    it("throws INACTIVE for deactivated challenge", async () => {
      mockChallengeFindUnique.mockResolvedValue({
        id: "c1",
        active: false,
      })

      await expect(
        ChallengeService.completeChallenge("user-1", "c1")
      ).rejects.toThrow("no está activo")
    })

    it("throws ALREADY_COMPLETED for double completion", async () => {
      mockChallengeFindUnique.mockResolvedValue({
        id: "c1",
        active: true,
        points: 10,
      })
      mockUserChallengeFindUnique.mockResolvedValue({
        completed: true,
      })

      await expect(
        ChallengeService.completeChallenge("user-1", "c1")
      ).rejects.toThrow("Ya completaste")
    })
  })

  describe("createChallenge", () => {
    it("creates a new challenge", async () => {
      mockChallengeCreate.mockResolvedValue({
        id: "new",
        title: "New Challenge",
        description: "A new one",
        points: 10,
        frequency: "weekly",
        active: true,
      })

      const result = await ChallengeService.createChallenge({
        title: "New Challenge",
        description: "A new one",
      })

      expect(result.title).toBe("New Challenge")
      expect(mockChallengeCreate).toHaveBeenCalled()
    })
  })

  describe("deactivateChallenge", () => {
    it("deactivates an active challenge", async () => {
      mockChallengeFindUnique.mockResolvedValue({ id: "c1", active: true })
      mockChallengeUpdate.mockResolvedValue({})

      await ChallengeService.deactivateChallenge("c1")

      expect(mockChallengeUpdate).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { active: false },
      })
    })

    it("throws for nonexistent challenge", async () => {
      mockChallengeFindUnique.mockResolvedValue(null)

      await expect(ChallengeService.deactivateChallenge("missing")).rejects.toThrow(
        "Desafío no encontrado"
      )
    })
  })

  describe("getUserStats", () => {
    it("returns user challenge stats", async () => {
      mockUserChallengeCount.mockResolvedValue(5)
      mockChallengeCount.mockResolvedValue(3)
      mockUserChallengeFindMany.mockResolvedValue([
        { challenge: { points: 10 } },
        { challenge: { points: 20 } },
      ])

      const result = await ChallengeService.getUserStats("user-1")

      expect(result.completed).toBe(5)
      expect(result.pending).toBe(3)
      expect(result.totalPoints).toBe(30)
    })
  })
})
