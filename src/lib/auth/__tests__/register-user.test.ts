import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindUnique, mockFindFirst, mockCreate, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    clinic: { findUnique: mockFindUnique, create: mockCreate, update: mockUpdate },
    user: { findUnique: mockFindUnique, findFirst: mockFindFirst, create: mockCreate },
    rateLimit: { findUnique: vi.fn(), delete: mockDelete, upsert: vi.fn() },
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4 }),
  clearRateLimit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  buildWelcomeEmail: vi.fn().mockReturnValue({ subject: "Welcome", html: "<p>Welcome</p>" }),
}))

vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn(() => ({ toString: () => "salt123" })),
    scrypt: vi.fn((_pwd: string, _salt: string, _len: number, cb: any) => cb(null, { toString: () => "hashedkey" })),
  },
  randomBytes: vi.fn(() => ({ toString: () => "salt123" })),
  scrypt: vi.fn((_pwd: string, _salt: string, _len: number, cb: any) => cb(null, { toString: () => "hashedkey" })),
}))

import { registerUser } from "@/lib/auth"

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindUnique.mockResolvedValue(null)
    mockFindFirst.mockResolvedValue(null)
  })

  it("creates user without esthetician code", async () => {
    mockCreate.mockResolvedValue({ id: "u1", email: "test@test.com", name: "Test" })
    const result = await registerUser("test@test.com", "password123", "Test")
    expect(result.error).toBeUndefined()
    expect(result.user?.id).toBe("u1")
  })

  it("rejects duplicate email", async () => {
    mockFindUnique.mockResolvedValue({ id: "existing" })
    const result = await registerUser("existing@test.com", "password123")
    expect(result.error).toBe("Ya existe una cuenta con este email")
  })

  it("links user to clinic with valid esthetician code", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockFindFirst.mockResolvedValue(null)
    const mockClinic = { id: "clinic-1" }
    mockFindUnique.mockImplementation(async (args: any) => {
      if (args.where?.referralCode) return mockClinic
      if (args.where?.email) return null
      return null
    })
    mockCreate.mockResolvedValue({ id: "u1", email: "test@test.com", name: "Test" })

    const result = await registerUser("test@test.com", "password123", "Test", undefined, "EST-ABC123")
    expect(result.error).toBeUndefined()
    const createCall = mockCreate.mock.calls[0][0]
    expect(createCall.data.referredByEstheticianId).toBe("clinic-1")
  })

  it("rejects invalid esthetician code", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockFindFirst.mockResolvedValue(null)
    mockFindUnique.mockImplementation(async (args: any) => {
      if (args.where?.referralCode) return null
      if (args.where?.email) return null
      return null
    })

    const result = await registerUser("test@test.com", "password123", "Test", undefined, "INVALID")
    expect(result.error).toBe("Código de esteticista inválido. Verifica e intenta de nuevo.")
  })

  it("rejects short username", async () => {
    const result = await registerUser("test@test.com", "password123", "Test", "ab")
    expect(result.error).toContain("3 caracteres")
  })

  it("rejects taken username", async () => {
    mockFindFirst.mockResolvedValue({ id: "other" })
    const result = await registerUser("test@test.com", "password123", "Test", "takenuser")
    expect(result.error).toBe("Este nombre de usuario ya está en uso")
  })
})
