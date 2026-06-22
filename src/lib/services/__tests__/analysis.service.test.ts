import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockCheckAndDeductUsage, mockAnalyzeSkin, mockAnalysisRepository } = vi.hoisted(() => ({
  mockCheckAndDeductUsage: vi.fn(),
  mockAnalyzeSkin: vi.fn(),
  mockAnalysisRepository: {
    create: vi.fn(),
  },
}))

vi.mock("@/lib/usage", () => ({
  checkAndDeductUsage: mockCheckAndDeductUsage,
}))

vi.mock("@/lib/openrouter", () => ({
  analyzeSkin: mockAnalyzeSkin,
}))

vi.mock("@/lib/repositories", () => ({
  AnalysisRepository: mockAnalysisRepository,
}))

import { AnalysisService } from "../analysis.service"

function createMockFile(content = "fake-image-data", name = "photo.jpg"): File {
  const blob = new Blob([content], { type: "image/jpeg" })
  return new File([blob], name, { type: "image/jpeg" })
}

describe("AnalysisService.processAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("throws error when usage limit reached", async () => {
    mockCheckAndDeductUsage.mockResolvedValue({ allowed: false, error: "Límite alcanzado" })

    await expect(
      AnalysisService.processAnalysis("user-1", [createMockFile()], { concerns: "acné" })
    ).rejects.toThrow("Límite alcanzado")
  })

  it("throws error when file exceeds 10MB", async () => {
    mockCheckAndDeductUsage.mockResolvedValue({ allowed: true, error: null })

    const bigContent = "x".repeat(12 * 1024 * 1024)
    const bigFile = createMockFile(bigContent)

    await expect(
      AnalysisService.processAnalysis("user-1", [bigFile], { concerns: "acné" })
    ).rejects.toThrow("Una imagen supera los 10MB")
  })

  it("creates analysis record on success", async () => {
    mockCheckAndDeductUsage.mockResolvedValue({ allowed: true, error: null })
    mockAnalyzeSkin.mockResolvedValue({
      skinType: "mixta",
      observations: [{ category: "texture", severity: "leve" }],
      recommendations: ["Usar protector solar"],
      routine: [
        { time: "mañana", steps: ["Lavar", "Hidratar"] },
      ],
    })
    mockAnalysisRepository.create.mockResolvedValue({
      id: "analysis-1",
      skinType: "mixta",
      concerns: "acné",
    })

    const result = await AnalysisService.processAnalysis(
      "user-1",
      [createMockFile()],
      { concerns: "acné", age: "25-30", gender: "femenino" }
    )

    expect(result.analysis.id).toBe("analysis-1")
    expect(result.result.skinType).toBe("mixta")
    expect(mockAnalysisRepository.create).toHaveBeenCalledWith({
      userId: "user-1",
      skinType: "mixta",
      concerns: "acné",
      observations: expect.any(String),
      recommendations: expect.any(String),
      routine: expect.any(String),
    })
  })

  it("passes language to analyzeSkin", async () => {
    mockCheckAndDeductUsage.mockResolvedValue({ allowed: true, error: null })
    mockAnalyzeSkin.mockResolvedValue({
      skinType: "normal",
      observations: [],
      recommendations: [],
    })
    mockAnalysisRepository.create.mockResolvedValue({ id: "a1" })

    await AnalysisService.processAnalysis(
      "user-1",
      [createMockFile()],
      { concerns: "acné", language: "en" }
    )

    expect(mockAnalyzeSkin).toHaveBeenCalledWith(
      expect.objectContaining({ language: "en" })
    )
  })
})
