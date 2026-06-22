import { describe, it, expect } from "vitest"
import { generateCsrfToken, validateCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf"

describe("generateCsrfToken", () => {
  it("generates a hex string of 64 characters", () => {
    const token = generateCsrfToken()
    expect(token).toHaveLength(64)
    expect(/^[0-9a-f]+$/.test(token)).toBe(true)
  })

  it("generates unique tokens each time", () => {
    const t1 = generateCsrfToken()
    const t2 = generateCsrfToken()
    expect(t1).not.toBe(t2)
  })
})

describe("validateCsrfToken", () => {
  it("validates matching tokens", () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(token, token)).toBe(true)
  })

  it("rejects mismatched tokens", () => {
    const token = generateCsrfToken()
    const other = generateCsrfToken()
    expect(validateCsrfToken(token, other)).toBe(false)
  })

  it("rejects empty token", () => {
    expect(validateCsrfToken("", "abc")).toBe(false)
  })

  it("rejects null stored token", () => {
    expect(validateCsrfToken("abc", "")).toBe(false)
  })
})

describe("CSRF constants", () => {
  it("has correct cookie name", () => {
    expect(CSRF_COOKIE_NAME).toBe("csrf-token")
  })

  it("has correct header name", () => {
    expect(CSRF_HEADER_NAME).toBe("x-csrf-token")
  })
})
