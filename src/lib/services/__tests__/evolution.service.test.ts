import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindEvolution } = vi.hoisted(() => ({
  mockFindEvolution: vi.fn(),
}))

vi.mock("@/lib/repositories", () => ({
  AnalysisRepository: {
    findEvolution: mockFindEvolution,
  },
}))

import { getSkinEvolution } from "../evolution.service"

describe("getSkinEvolution", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns empty result when no analyses exist", async () => {
    mockFindEvolution.mockResolvedValue([])

    const result = await getSkinEvolution("user-1")

    expect(result.totalAnalyses).toBe(0)
    expect(result.points).toEqual([])
    expect(result.firstAnalysis).toBeNull()
    expect(result.latestAnalysis).toBeNull()
  })

  it("returns insufficient_data for all trends with single analysis", async () => {
    mockFindEvolution.mockResolvedValue([
      {
        createdAt: new Date("2025-01-01"),
        observations: JSON.stringify({
          texture: "leve",
          shine: "bajo",
          pores: "moderado",
          uniformity: "normal",
          apparentSensitivity: "bajo",
          apparentOil: "leve",
        }),
      },
    ])

    const result = await getSkinEvolution("user-1")

    expect(result.totalAnalyses).toBe(1)
    expect(result.points).toHaveLength(1)
    expect(result.trends.texture).toBe("insufficient_data")
    expect(result.trends.shine).toBe("insufficient_data")
    expect(result.trends.pores).toBe("insufficient_data")
  })

  it("detects improving trend when values decrease", async () => {
    mockFindEvolution.mockResolvedValue([
      {
        createdAt: new Date("2025-01-01"),
        observations: JSON.stringify({ texture: "alto", shine: "visible" }),
      },
      {
        createdAt: new Date("2025-02-01"),
        observations: JSON.stringify({ texture: "moderado", shine: "bajo" }),
      },
    ])

    const result = await getSkinEvolution("user-1")

    expect(result.totalAnalyses).toBe(2)
    expect(result.trends.texture).toBe("improving")
    expect(result.trends.shine).toBe("improving")
  })

  it("detects worsening trend when values increase", async () => {
    mockFindEvolution.mockResolvedValue([
      {
        createdAt: new Date("2025-01-01"),
        observations: JSON.stringify({ texture: "bajo", pores: "leve" }),
      },
      {
        createdAt: new Date("2025-02-01"),
        observations: JSON.stringify({ texture: "visible", pores: "alto" }),
      },
    ])

    const result = await getSkinEvolution("user-1")

    expect(result.trends.texture).toBe("worsening")
    expect(result.trends.pores).toBe("worsening")
  })

  it("detects stable trend when difference is 0 or 1", async () => {
    mockFindEvolution.mockResolvedValue([
      {
        createdAt: new Date("2025-01-01"),
        observations: JSON.stringify({ texture: "leve" }),
      },
      {
        createdAt: new Date("2025-02-01"),
        observations: JSON.stringify({ texture: "leve" }),
      },
    ])

    const result = await getSkinEvolution("user-1")
    expect(result.trends.texture).toBe("stable")
  })

  it("handles multi-point evolution correctly", async () => {
    mockFindEvolution.mockResolvedValue([
      {
        createdAt: new Date("2025-01-01"),
        observations: JSON.stringify({ texture: "alto" }),
      },
      {
        createdAt: new Date("2025-02-01"),
        observations: JSON.stringify({ texture: "moderado" }),
      },
      {
        createdAt: new Date("2025-03-01"),
        observations: JSON.stringify({ texture: "leve" }),
      },
      {
        createdAt: new Date("2025-04-01"),
        observations: JSON.stringify({ texture: "bajo" }),
      },
    ])

    const result = await getSkinEvolution("user-1")

    expect(result.totalAnalyses).toBe(4)
    expect(result.trends.texture).toBe("improving")
    expect(result.firstAnalysis?.texture).toBe("alto")
    expect(result.latestAnalysis?.texture).toBe("bajo")
  })

  it("returns first and latest analysis correctly", async () => {
    mockFindEvolution.mockResolvedValue([
      {
        createdAt: new Date("2025-01-01"),
        observations: JSON.stringify({ texture: "alto" }),
      },
      {
        createdAt: new Date("2025-06-01"),
        observations: JSON.stringify({ texture: "bajo" }),
      },
    ])

    const result = await getSkinEvolution("user-1")

    expect(result.firstAnalysis?.date).toBe("2025-01-01")
    expect(result.latestAnalysis?.date).toBe("2025-06-01")
  })

  it("handles malformed JSON in observations", async () => {
    mockFindEvolution.mockResolvedValue([
      {
        createdAt: new Date("2025-01-01"),
        observations: "not valid json",
      },
      {
        createdAt: new Date("2025-02-01"),
        observations: JSON.stringify({ texture: "bajo" }),
      },
    ])

    const result = await getSkinEvolution("user-1")

    expect(result.points).toHaveLength(2)
    expect(result.points[0].texture).toBeUndefined()
    expect(result.points[1].texture).toBe("bajo")
  })
})
