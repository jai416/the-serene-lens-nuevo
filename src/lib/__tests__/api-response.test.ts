import { describe, it, expect } from "vitest"
import { apiResponse, apiError, ok, error, unauthorized, forbidden, notFound, serverError } from "@/lib/api-response"

describe("apiResponse", () => {
  it("returns success response with data", async () => {
    const res = apiResponse({ name: "test" })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ name: "test" })
  })

  it("uses custom status code", async () => {
    const res = apiResponse({ id: 1 }, 201)
    expect(res.status).toBe(201)
  })
})

describe("apiError", () => {
  it("returns error response with code and message", async () => {
    const res = apiError("NOT_FOUND", "User not found")
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("NOT_FOUND")
    expect(body.error.message).toBe("User not found")
  })

  it("uses default message when not provided", async () => {
    const res = apiError("INTERNAL_ERROR")
    const body = await res.json()
    expect(body.error.message).toBe("Error interno del servidor")
  })
})

describe("ok", () => {
  it("returns 200 with success true", async () => {
    const res = ok([1, 2, 3])
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([1, 2, 3])
  })
})

describe("error", () => {
  it("returns 400 with validation error", async () => {
    const res = error("Campo inválido")
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
    expect(body.error.message).toBe("Campo inválido")
  })
})

describe("unauthorized", () => {
  it("returns 401", async () => {
    const res = unauthorized()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe("UNAUTHORIZED")
  })
})

describe("forbidden", () => {
  it("returns 403", async () => {
    const res = forbidden()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe("FORBIDDEN")
  })
})

describe("notFound", () => {
  it("returns 404", async () => {
    const res = notFound()
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })
})

describe("serverError", () => {
  it("returns 500", async () => {
    const res = serverError()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe("INTERNAL_ERROR")
  })
})
