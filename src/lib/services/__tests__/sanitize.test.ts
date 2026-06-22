import { describe, it, expect } from "vitest"
import { sanitizeHtml, sanitizeObject } from "@/lib/sanitize"

describe("sanitizeHtml", () => {
  it("escapes & to &amp;", () => {
    expect(sanitizeHtml("a & b")).toBe("a &amp; b")
  })

  it("escapes < to &lt;", () => {
    expect(sanitizeHtml("<script>")).toBe("&lt;script&gt;")
  })

  it("escapes > to &gt;", () => {
    expect(sanitizeHtml("5 > 3")).toBe("5 &gt; 3")
  })

  it("escapes double quotes to &quot;", () => {
    expect(sanitizeHtml('he said "hello"')).toBe("he said &quot;hello&quot;")
  })

  it("escapes single quotes to &#x27;", () => {
    expect(sanitizeHtml("it's")).toBe("it&#x27;s")
  })

  it("escapes forward slash", () => {
    expect(sanitizeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;&#x2F;script&gt;"
    )
  })

  it("returns empty string for non-string input", () => {
    expect(sanitizeHtml(null as unknown as string)).toBe("")
    expect(sanitizeHtml(undefined as unknown as string)).toBe("")
    expect(sanitizeHtml(123 as unknown as string)).toBe("")
  })

  it("passes through safe text unchanged", () => {
    expect(sanitizeHtml("hello world")).toBe("hello world")
    expect(sanitizeHtml("Hello, ¿cómo estás?")).toBe("Hello, ¿cómo estás?")
  })
})

describe("sanitizeObject", () => {
  it("sanitizes specified string fields", () => {
    const obj = {
      name: "<b>John</b>",
      email: "john@test.com",
      age: 30,
    }
    const result = sanitizeObject(obj, ["name", "email"])
    expect(result.name).toBe("&lt;b&gt;John&lt;&#x2F;b&gt;")
    expect(result.email).toBe("john@test.com")
    expect(result.age).toBe(30)
  })

  it("leaves unspecified fields untouched", () => {
    const obj = { name: "<script>", bio: "<p>safe</p>" }
    const result = sanitizeObject(obj, ["bio"])
    expect(result.name).toBe("<script>")
    expect(result.bio).toBe("&lt;p&gt;safe&lt;&#x2F;p&gt;")
  })

  it("handles empty objects", () => {
    expect(sanitizeObject({}, [])).toEqual({})
  })
})
