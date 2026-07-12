import { describe, it, expect } from "vitest"
import { buildEmailHtml, buildPasswordResetEmail, buildWelcomeEmail, buildPaymentSuccessEmail, buildTrialEndedEmail } from "@/lib/email"

describe("buildEmailHtml", () => {
  it("renders basic email with title and message", () => {
    const html = buildEmailHtml("Hello", "World")
    expect(html).toContain("Hello")
    expect(html).toContain("World")
    expect(html).toContain("The Serene Lens")
  })

  it("includes link when provided", () => {
    const html = buildEmailHtml("Test", "Message", "https://example.com")
    expect(html).toContain("https://example.com")
    expect(html).toContain("Ver más")
  })

  it("does not include link when not provided", () => {
    const html = buildEmailHtml("Test", "Message")
    expect(html).not.toContain("Ver más")
  })
})

describe("buildPasswordResetEmail", () => {
  it("returns subject and html with reset link", () => {
    const result = buildPasswordResetEmail("https://example.com/reset?token=abc")
    expect(result.subject).toContain("Recuperación")
    expect(result.html).toContain("https://example.com/reset?token=abc")
    expect(result.html).toContain("1 hora")
  })
})

describe("buildWelcomeEmail", () => {
  it("includes user name when provided", () => {
    const result = buildWelcomeEmail("Juan")
    expect(result.subject).toContain("Bienvenido")
    expect(result.html).toContain("Juan")
    expect(result.html).toContain("7 días")
    expect(result.html).toContain("PREMIUM")
  })

  it("works with empty name", () => {
    const result = buildWelcomeEmail("")
    expect(result.subject).toContain("Bienvenido")
    expect(result.html).toContain("7 días")
    expect(result.html).toContain("PREMIUM")
  })
})

describe("buildTrialEndedEmail", () => {
  it("includes user name and trial ended message", () => {
    const result = buildTrialEndedEmail("Juan")
    expect(result.subject).toContain("prueba")
    expect(result.html).toContain("Juan")
    expect(result.html).toContain("7 días")
    expect(result.html).toContain("Essential")
  })

  it("works with empty name", () => {
    const result = buildTrialEndedEmail("")
    expect(result.subject).toContain("prueba")
    expect(result.html).toContain("Essential")
  })
})

describe("buildPaymentSuccessEmail", () => {
  it("includes plan name and amount", () => {
    const result = buildPaymentSuccessEmail("PREMIUM", 4.99)
    expect(result.subject).toContain("Premium")
    expect(result.html).toContain("4.99")
  })

  it("handles pack names", () => {
    const result = buildPaymentSuccessEmail("BASIC", 1.99)
    expect(result.subject).toContain("Básico")
  })
})
