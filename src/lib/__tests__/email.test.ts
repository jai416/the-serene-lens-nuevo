import { describe, it, expect } from "vitest"
import { buildEmailHtml, buildPasswordResetEmail, buildWelcomeEmail, buildPaymentSuccessEmail, buildTrialEndedEmail } from "@/lib/email"

describe("buildEmailHtml", () => {
  it("returns proximamente markup", () => {
    const html = buildEmailHtml("Hello", "World")
    expect(html).toContain("Próximamente")
  })
})

describe("buildPasswordResetEmail", () => {
  it("returns subject and html with reset link", () => {
    const result = buildPasswordResetEmail("https://example.com/reset?token=abc")
    expect(result.subject).toContain("Próximamente")
    expect(result.html).toContain("https://example.com/reset?token=abc")
  })
})

describe("buildWelcomeEmail", () => {
  it("returns proximamente content", () => {
    const result = buildWelcomeEmail("Juan")
    expect(result.subject).toContain("Próximamente")
  })
})

describe("buildTrialEndedEmail", () => {
  it("returns proximamente content", () => {
    const result = buildTrialEndedEmail("Juan")
    expect(result.subject).toContain("Próximamente")
  })
})

describe("buildPaymentSuccessEmail", () => {
  it("returns proximamente content", () => {
    const result = buildPaymentSuccessEmail("PREMIUM", 4.99)
    expect(result.subject).toContain("Próximamente")
  })
})
