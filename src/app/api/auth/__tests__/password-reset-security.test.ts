import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockVTFindUnique, mockVTCreate, mockVTDelete, mockVTDeleteMany, mockUserUpdate, mockUserFindUnique, mockRateLimit } =
  vi.hoisted(() => ({
    mockVTFindUnique: vi.fn(),
    mockVTCreate: vi.fn(),
    mockVTDelete: vi.fn(),
    mockVTDeleteMany: vi.fn(),
    mockUserUpdate: vi.fn(),
    mockUserFindUnique: vi.fn(),
    mockRateLimit: vi.fn(),
  }))

vi.mock("@/lib/db", () => ({
  db: {
    verificationToken: {
      findUnique: mockVTFindUnique,
      create: mockVTCreate,
      delete: mockVTDelete,
      deleteMany: mockVTDeleteMany,
    },
    user: { findUnique: mockUserFindUnique, update: mockUserUpdate },
  },
}))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: (...args: unknown[]) => mockRateLimit(...args) }))
vi.mock("@/lib/csrf-middleware", () => ({ validateCsrf: vi.fn(() => true) }))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { POST as forgotPOST } from "../forgot-password/route"
import { POST as resetPOST } from "../reset-password/route"

const forgotReq = (payload: unknown) =>
  new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })

const resetReq = (payload: Record<string, unknown>) =>
  new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })

beforeEach(() => {
  vi.clearAllMocks()
  mockRateLimit.mockResolvedValue({ allowed: true })
  // los handlers hacen await + .catch sobre estas llamadas: deben ser promesas
  mockVTDelete.mockResolvedValue({})
  mockVTDeleteMany.mockResolvedValue({})
  mockVTCreate.mockResolvedValue({})
  mockUserUpdate.mockResolvedValue({})
})

// ── Fase C: forgot-password NO expone tokens ni permite enumeración ───────

describe("forgot-password — flujo público cerrado (M3.5.19)", () => {
  it("respuesta idéntica exista o no la cuenta, y NUNCA consulta la BD de usuarios", async () => {
    const r1 = await forgotPOST(forgotReq({ email: "existe@test.com" }) as never)
    const r2 = await forgotPOST(forgotReq({ email: "noexiste@test.com" }) as never)
    const b1 = await r1.json()
    const b2 = await r2.json()
    expect(r1.status).toBe(r2.status)
    expect(b1).toEqual(b2)
    // la rama no depende de la existencia de la cuenta:0 consultas de usuario
    expect(mockUserFindUnique).not.toHaveBeenCalled()
    expect(mockVTCreate).not.toHaveBeenCalled() // ningún token creado
    expect(mockVTDeleteMany).not.toHaveBeenCalled()
  })

  it("la respuesta NO contiene resetUrl, tokens ni cadenas hex de32+", async () => {
    const r = await forgotPOST(forgotReq({ email: "alguien@test.com" }) as never)
    const s = JSON.stringify(await r.json())
    expect(s).not.toContain("resetUrl")
    expect(s).not.toMatch(/[0-9a-f]{32,}/i)
    expect(s).not.toContain("token")
    expect(s).toMatch(/deshabilitada/) // mensaje honesto, sin prometer email
    expect(s).not.toMatch(/enviamos|correo enviado|te enviaremos/i) // no simula email
  })

  it("mantiene rate limits por IP y por email", async () => {
    await forgotPOST(forgotReq({ email: "x@test.com" }) as never)
    const keys = mockRateLimit.mock.calls.map((c) => c[0])
    expect(keys.some((k) => String(k).startsWith("forgot-password:") && !String(k).includes("email"))).toBe(true)
    expect(keys.some((k) => String(k).startsWith("forgot-password:email:"))).toBe(true)
  })

  it("rate limit aplicado → misma respuesta genérica (sin enumeración por límite)", async () => {
    mockRateLimit.mockResolvedValue({ allowed: false })
    const r1 = await forgotPOST(forgotReq({ email: "a@test.com" }) as never)
    const r2 = await forgotPOST(forgotReq({ email: "b@test.com" }) as never)
    expect(r1.status).toBe(429)
    expect(await r1.json()).toEqual(await r2.json())
    expect(mockVTCreate).not.toHaveBeenCalled()
  })

  it("email malformado →400 sin consulta de cuenta", async () => {
    const r = await forgotPOST(forgotReq({ email: 123 }) as never)
    expect(r.status).toBe(400)
    expect(mockUserFindUnique).not.toHaveBeenCalled()
  })
})

// ── Fase C: reset-password — expiración, uso único, rechazos ──────────────

describe("reset-password — tokens (uso único y expiración intactos)", () => {
  it("token inexistente →400 genérico y NO modifica la cuenta", async () => {
    mockVTFindUnique.mockResolvedValue(null)
    const r = await resetPOST(resetReq({ email: "a@b.c", token: "x".repeat(64), password: "nueva123456" }) as never)
    expect(r.status).toBe(400)
    expect((await r.json()).error.message).toContain("Token inválido o expirado")
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it("token expirado → MISMO mensaje que inválido (uniforme) + limpieza, sin update", async () => {
    mockVTFindUnique.mockResolvedValue({ identifier: "a@b.c", token: "t", expires: new Date(Date.now() - 1000) })
    const r = await resetPOST(resetReq({ email: "a@b.c", token: "t", password: "nueva123456" }) as never)
    expect(r.status).toBe(400)
    expect((await r.json()).error.message).toBe("Token inválido o expirado") // uniforme con el caso inválido
    expect(mockVTDelete).toHaveBeenCalled() // expirado se consume/limpia
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it("token válido → actualiza con hash (nunca texto plano) y consume el token", async () => {
    mockVTFindUnique.mockResolvedValue({ identifier: "a@b.c", token: "t", expires: new Date(Date.now() + 60000) })
    const r = await resetPOST(resetReq({ email: "a@b.c", token: "t", password: "nueva123456" }) as never)
    expect(r.status).toBe(200)
    expect(mockUserUpdate).toHaveBeenCalledTimes(1)
    const stored = mockUserUpdate.mock.calls[0][0].data.password as string
    expect(stored).toMatch(/^[0-9a-f]+:[0-9a-f]+$/) // formato scrypt salt:hex
    expect(stored).not.toContain("nueva123456") // jamás texto plano
    expect(mockVTDelete).toHaveBeenCalledWith({ where: { token: "t" } }) // uso único
  })

  it("token reutilizado →2ª vez rechazado con update exactamente1 vez", async () => {
    mockVTFindUnique
      .mockResolvedValueOnce({ identifier: "a@b.c", token: "t", expires: new Date(Date.now() + 60000) })
      .mockResolvedValueOnce(null) // ya consumido
    const ok1 = await resetPOST(resetReq({ email: "a@b.c", token: "t", password: "nueva123456" }) as never)
    const ok2 = await resetPOST(resetReq({ email: "a@b.c", token: "t", password: "otra1234567" }) as never)
    expect(ok1.status).toBe(200)
    expect(ok2.status).toBe(400)
    expect(mockUserUpdate).toHaveBeenCalledTimes(1)
  })

  it("contraseña corta →400 antes de consultar tokens", async () => {
    const r = await resetPOST(resetReq({ email: "a@b.c", token: "t", password: "123" }) as never)
    expect(r.status).toBe(400)
    expect(mockVTFindUnique).not.toHaveBeenCalled()
  })
})
