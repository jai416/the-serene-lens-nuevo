import { describe, it, expect, vi, beforeEach } from "vitest"

const {
  mockFindMany,
  mockUpsert,
  mockFindUnique,
  mockDelete,
  mockLoggerInfo,
  mockLoggerError,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockUpsert: vi.fn(),
  mockFindUnique: vi.fn(),
  mockDelete: vi.fn(),
  mockLoggerInfo: vi.fn(),
  mockLoggerError: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    skinDiary: {
      findMany: mockFindMany,
      upsert: mockUpsert,
      findUnique: mockFindUnique,
      delete: mockDelete,
    },
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: mockLoggerInfo, error: mockLoggerError, warn: vi.fn(), debug: vi.fn() },
}))

import { DiaryService, DiaryError } from "../diary.service"

describe("DiaryService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getEntries", () => {
    it("returns entries for the last 30 days", async () => {
      const mockEntries = [
        { id: "1", date: new Date(), feeling: 4, notes: "Bien", createdAt: new Date() },
      ]
      mockFindMany.mockResolvedValue(mockEntries)

      const result = await DiaryService.getEntries("user-1")

      expect(result).toEqual(mockEntries)
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1", date: { gte: expect.any(Date) } },
        orderBy: { date: "desc" },
        select: { id: true, date: true, feeling: true, notes: true, createdAt: true },
      })
    })

    it("returns empty array when no entries", async () => {
      mockFindMany.mockResolvedValue([])

      const result = await DiaryService.getEntries("user-1")
      expect(result).toEqual([])
    })

    it("accepts custom days parameter", async () => {
      mockFindMany.mockResolvedValue([])

      await DiaryService.getEntries("user-1", 7)

      const call = mockFindMany.mock.calls[0][0]
      const cutoff = call.where.date.gte as Date
      const expected = new Date()
      expected.setDate(expected.getDate() - 7)
      expect(cutoff.getDate()).toBe(expected.getDate())
    })
  })

  describe("upsertEntry", () => {
    it("creates or updates a diary entry", async () => {
      const mockEntry = { id: "1", date: new Date(), feeling: 4, notes: "Test", createdAt: new Date() }
      mockUpsert.mockResolvedValue(mockEntry)

      const today = new Date()
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

      const result = await DiaryService.upsertEntry("user-1", dateStr, 4, "Test")

      expect(result).toEqual(mockEntry)
      expect(mockUpsert).toHaveBeenCalled()
    })

    it("throws on future date", async () => {
      const future = new Date()
      future.setDate(future.getDate() + 2)
      const dateStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`

      await expect(DiaryService.upsertEntry("user-1", dateStr, 3)).rejects.toThrow(DiaryError)
    })
  })

  describe("deleteEntry", () => {
    it("deletes an entry owned by the user", async () => {
      mockFindUnique.mockResolvedValue({ id: "entry-1", userId: "user-1" })
      mockDelete.mockResolvedValue({})

      await DiaryService.deleteEntry("user-1", "entry-1")

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "entry-1" } })
    })

    it("throws NOT_FOUND when entry doesn't exist", async () => {
      mockFindUnique.mockResolvedValue(null)

      await expect(DiaryService.deleteEntry("user-1", "missing")).rejects.toThrow("Entrada no encontrada")
    })

    it("throws UNAUTHORIZED when entry belongs to another user", async () => {
      mockFindUnique.mockResolvedValue({ id: "entry-1", userId: "user-2" })

      await expect(DiaryService.deleteEntry("user-1", "entry-1")).rejects.toThrow("No autorizado")
    })
  })

  describe("getWeeklyTrend", () => {
    it("returns null when no entries this week", async () => {
      mockFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await DiaryService.getWeeklyTrend("user-1")
      expect(result).toBeNull()
    })

    it("returns stable trend when only this week has entries", async () => {
      mockFindMany
        .mockResolvedValueOnce([{ feeling: 4 }, { feeling: 3 }])
        .mockResolvedValueOnce([])

      const result = await DiaryService.getWeeklyTrend("user-1")

      expect(result).not.toBeNull()
      expect(result!.trend).toBe("stable")
      expect(result!.avg).toBe(3.5)
    })

    it("detects improving trend", async () => {
      mockFindMany
        .mockResolvedValueOnce([{ feeling: 5 }, { feeling: 4 }])
        .mockResolvedValueOnce([{ feeling: 2 }, { feeling: 3 }])

      const result = await DiaryService.getWeeklyTrend("user-1")

      expect(result!.trend).toBe("up")
    })

    it("detects worsening trend", async () => {
      mockFindMany
        .mockResolvedValueOnce([{ feeling: 1 }, { feeling: 2 }])
        .mockResolvedValueOnce([{ feeling: 4 }, { feeling: 5 }])

      const result = await DiaryService.getWeeklyTrend("user-1")

      expect(result!.trend).toBe("down")
    })
  })
})
