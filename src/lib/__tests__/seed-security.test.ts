import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/**
 * M3.5.19 Fase C — seguridad de seeds y .env.example (tests ESTÁTICOS:
 * leen las fuentes; NUNCA ejecutan el seed contra ninguna BD).
 * Los literales inseguros se construyen dinámicamente para no publicarlos
 * de nuevo en un fichero versionado.
 */

const ROOT = process.cwd()
const SEED = fs.readFileSync(path.join(ROOT, "prisma", "seed.ts"), "utf8")
const ENV_EXAMPLE = fs.readFileSync(path.join(ROOT, ".env.example"), "utf8")
const OLD_DEFAULTS = ["admin" + "123", "demo" + "123"] // construidos, no literales

describe("prisma/seed.ts — sin credenciales por defecto", () => {
  it("SEED_ADMIN_PASSWORD no tiene valor por defecto (se exige env explícita)", () => {
    expect(SEED).not.toMatch(/SEED_ADMIN_PASSWORD\s*\|\|/)
    expect(SEED).toContain("process.env.SEED_ADMIN_PASSWORD")
  })

  it("si falta la env, el ADMIN se OMITE con warning seguro (sin secretos)", () => {
    expect(SEED).toMatch(/if \(adminPassword\)/)
    expect(SEED).toMatch(/console\.warn\(.*SEED_ADMIN_PASSWORD no configurada/)
    // el warning nunca puede imprimir la contraseña
    const warnLine = SEED.split("\n").find((l) => l.includes("SEED_ADMIN_PASSWORD no configurada")) || ""
    expect(warnLine).not.toMatch(/adminPassword\}|password:/)
  })

  it("el demo exige SEED_DEMO_PASSWORD explícita (sin contraseña por defecto)", () => {
    expect(SEED).toMatch(/process\.env\.SEED_DEMO_PASSWORD/)
    expect(SEED).not.toMatch(/SEED_DEMO_PASSWORD\s*\|\|/)
    expect(SEED).toMatch(/if \(demoPassword\)/)
    expect(SEED).toMatch(/console\.warn\(.*SEED_DEMO_PASSWORD no configurada/)
  })

  it("nunca sobrescribe contraseñas existentes (upsert update vacío)", () => {
    expect((SEED.match(/update: \{\}/g) || []).length).toBeGreaterThanOrEqual(2)
  })

  it("no imprime contraseñas por consola", () => {
    expect(SEED).not.toContain("(password: ${")
    expect(SEED).not.toMatch(/console\.log\([^)]*password[^)]*\)/i)
  })

  it("no contienen los literales inseguros conocidos", () => {
    for (const lit of OLD_DEFAULTS) {
      expect(SEED.includes(lit), "seed sin literal inseguro").toBe(false)
    }
  })
})

describe(".env.example — sin credenciales reales ni formas de token", () => {
  it("SEED_ADMIN_PASSWORD es un placeholder claramente ficticio", () => {
    const m = ENV_EXAMPLE.match(/^SEED_ADMIN_PASSWORD=(.*)$/m)
    expect(m).toBeDefined()
    expect(m![1]).toBe("SET-A-VALUE-HERE")
    for (const lit of OLD_DEFAULTS) expect(m![1]).not.toBe(lit)
  })

  it("claves con forma de credencial quedan vacías (no publican tokens)", () => {
    for (const key of ["TELEGRAM_TOKEN", "TELEGRAM_ADMIN_TOKEN", "TELEGRAM_VALIDATOR_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "CRON_SECRET", "CLOUDINARY_URL"]) {
      expect(ENV_EXAMPLE, `${key} debe estar vacío`).toMatch(new RegExp(`^${key}=$`, "m"))
    }
  })

  it("ningún valor del example coincide con valores reales sensibles de .env (si existe .env local)", () => {
    const real: Record<string, string> = {}
    try {
      for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
        const t = line.trim()
        if (!t || t.startsWith("#") || !t.includes("=")) continue
        const [k, v] = t.split("=", 1)
        real[k] = (v || "").trim().replace(/^"|"$/g, "")
      }
    } catch {
      // sin .env local: solo se verifica el example
    }
    const example: Record<string, string> = {}
    for (const line of ENV_EXAMPLE.split("\n")) {
      const t = line.trim()
      if (!t || t.startsWith("#") || !t.includes("=")) continue
      const [k, v] = t.split("=", 1)
      example[k] = (v || "").trim()
    }
    const SENSITIVE = ["DATABASE_URL", "NEXTAUTH_SECRET", "GROQ_API_KEY", "TELEGRAM_TOKEN", "CRON_SECRET", "CLOUDINARY_URL", "UPSTASH_REDIS_REST_TOKEN", "SEED_ADMIN_PASSWORD", "PAYPAL_CLIENT_SECRET"]
    for (const key of SENSITIVE) {
      if (!real[key] || real[key].length < 8) continue
      expect(example[key], `${key} no debe coincidir con el valor real`).not.toBe(real[key])
    }
  })
})
