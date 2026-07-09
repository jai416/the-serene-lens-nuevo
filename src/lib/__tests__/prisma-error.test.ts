import { describe, it, expect } from "vitest"
import { handlePrismaError } from "@/lib/prisma-error"
import { Prisma } from "@/generated/prisma/client"

describe("handlePrismaError", () => {
  it("returns 401 for P2003 (FK violation)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
      code: "P2003",
      clientVersion: "7.8.0",
    })
    const res = handlePrismaError(error)
    expect(res).not.toBeNull()
    if (!res) return
    expect(res.status).toBe(401)
  })

  it("returns 404 for P2025 (not found)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "7.8.0",
    })
    const res = handlePrismaError(error)
    expect(res).not.toBeNull()
    if (!res) return
    expect(res.status).toBe(404)
  })

  it("returns 409 for P2002 (unique constraint)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "7.8.0",
    })
    const res = handlePrismaError(error)
    expect(res).not.toBeNull()
    if (!res) return
    expect(res.status).toBe(409)
  })

  it("returns null for unknown errors", () => {
    const error = new Error("Some random error")
    expect(handlePrismaError(error)).toBeNull()
  })

  it("returns null for non-Error values", () => {
    expect(handlePrismaError("string error")).toBeNull()
    expect(handlePrismaError(null)).toBeNull()
    expect(handlePrismaError({ code: "P2003" })).toBeNull()
  })
})
