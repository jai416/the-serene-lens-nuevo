import { describe, it, expect } from "vitest"
import { basePlan, isEstheticianPlan, hasProAccess, hasProPlusAccess } from "@/lib/pricing"

describe("basePlan", () => {
  it("quita el sufijo _ANNUAL", () => {
    expect(basePlan("ESTHETICIAN_ANNUAL")).toBe("ESTHETICIAN")
    expect(basePlan("PRO_PLUS_ANNUAL")).toBe("PRO_PLUS")
    expect(basePlan("PREMIUM_ANNUAL")).toBe("PREMIUM")
  })

  it("deja intactos los planes sin sufijo", () => {
    expect(basePlan("FREE")).toBe("FREE")
    expect(basePlan("ESTHETICIAN")).toBe("ESTHETICIAN")
  })

  it("trata un plan ausente como FREE", () => {
    expect(basePlan(undefined)).toBe("FREE")
    expect(basePlan(null)).toBe("FREE")
    expect(basePlan("")).toBe("FREE")
  })
})

describe("isEstheticianPlan", () => {
  it("acepta el plan mensual y el anual", () => {
    expect(isEstheticianPlan("ESTHETICIAN")).toBe(true)
    expect(isEstheticianPlan("ESTHETICIAN_ANNUAL")).toBe(true)
  })

  it("rechaza el resto de planes", () => {
    expect(isEstheticianPlan("FREE")).toBe(false)
    expect(isEstheticianPlan("PREMIUM")).toBe(false)
    expect(isEstheticianPlan("PREMIUM_ANNUAL")).toBe(false)
    expect(isEstheticianPlan("PRO")).toBe(false)
    expect(isEstheticianPlan(undefined)).toBe(false)
  })
})

describe("hasProAccess", () => {
  it("incluye PRO, PRO+ y esteticista (mensual y anual)", () => {
    expect(hasProAccess("PRO")).toBe(true)
    expect(hasProAccess("PRO_ANNUAL")).toBe(true)
    expect(hasProAccess("PRO_PLUS")).toBe(true)
    expect(hasProAccess("PRO_PLUS_ANNUAL")).toBe(true)
    expect(hasProAccess("ESTHETICIAN")).toBe(true)
    expect(hasProAccess("ESTHETICIAN_ANNUAL")).toBe(true)
  })

  it("no incluye planes básicos", () => {
    expect(hasProAccess("FREE")).toBe(false)
    expect(hasProAccess("PREMIUM")).toBe(false)
    expect(hasProAccess("PREMIUM_ANNUAL")).toBe(false)
  })
})

describe("hasProPlusAccess", () => {
  it("solo incluye PRO+ (mensual y anual)", () => {
    expect(hasProPlusAccess("PRO_PLUS")).toBe(true)
    expect(hasProPlusAccess("PRO_PLUS_ANNUAL")).toBe(true)
    expect(hasProPlusAccess("PRO")).toBe(false)
    expect(hasProPlusAccess("FREE")).toBe(false)
  })
})
