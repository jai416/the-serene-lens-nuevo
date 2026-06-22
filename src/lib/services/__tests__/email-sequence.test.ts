import { describe, it, expect, vi } from "vitest"
import { buildEmailSequence } from "../email-sequence"

describe("buildEmailSequence", () => {
  it("returns 6 emails", () => {
    const sequence = buildEmailSequence("Test User", "https://example.com")
    expect(sequence).toHaveLength(6)
  })

  it("has correct day ordering", () => {
    const sequence = buildEmailSequence("Test User", "https://example.com")
    const days = sequence.map((e) => e.day)
    expect(days).toEqual([0, 1, 3, 7, 14, 21])
  })

  it("includes user name in welcome email", () => {
    const sequence = buildEmailSequence("María", "https://example.com")
    expect(sequence[0].subject).toContain("Bienvenido")
    expect(sequence[0].html).toContain("María")
  })

  it("includes login URL in all emails", () => {
    const sequence = buildEmailSequence("User", "https://mysite.com")
    for (const email of sequence) {
      expect(email.html).toContain("https://mysite.com")
    }
  })

  it("has valid HTML in all emails", () => {
    const sequence = buildEmailSequence("User", "https://example.com")
    for (const email of sequence) {
      expect(email.html).toContain("<div")
      expect(email.html).toContain("</div>")
      expect(email.subject.length).toBeGreaterThan(0)
    }
  })
})
