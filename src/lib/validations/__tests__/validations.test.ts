import { describe, it, expect } from "vitest"
import { analysisBodySchema, contactSchema, profileSchema, feedbackSchema, clinicSchema, registerSchema, diaryEntrySchema, challengeCompleteSchema, challengeCreateSchema } from "@/lib/validations"

describe("analysisBodySchema", () => {
  it("accepts valid input with all fields", () => {
    const result = analysisBodySchema.safeParse({
      concerns: "acné",
      age: "25-30",
      gender: "femenino",
      climate: "tropical",
      routine: "basica",
      language: "es",
    })
    expect(result.success).toBe(true)
  })

  it("accepts input with only concerns", () => {
    const result = analysisBodySchema.safeParse({
      concerns: "arrugas",
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty input (all optional)", () => {
    const result = analysisBodySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("rejects extra keys (strict mode)", () => {
    const result = analysisBodySchema.safeParse({
      concerns: "acné",
      unknownField: "value",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid age value", () => {
    const result = analysisBodySchema.safeParse({
      concerns: "acné",
      age: "35-44",
    })
    expect(result.success).toBe(false)
  })

  it("accepts all valid age values", () => {
    for (const age of ["<18", "18-24", "25-30", "31-40", "41-50", "51+"] as const) {
      const result = analysisBodySchema.safeParse({ concerns: "test", age })
      expect(result.success).toBe(true)
    }
  })
})

describe("contactSchema", () => {
  it("accepts valid contact data", () => {
    const result = contactSchema.safeParse({
      name: "Juan",
      email: "juan@test.com",
      subject: "Consulta",
      message: "Hola, tengo una pregunta",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({
      name: "Juan",
      email: "not-an-email",
      subject: "Test",
      message: "Message",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty name", () => {
    const result = contactSchema.safeParse({
      name: "",
      email: "juan@test.com",
      subject: "Test",
      message: "Message",
    })
    expect(result.success).toBe(false)
  })

  it("rejects extra keys (strict mode)", () => {
    const result = contactSchema.safeParse({
      name: "Juan",
      email: "juan@test.com",
      subject: "Test",
      message: "Message",
      extra: "field",
    })
    expect(result.success).toBe(false)
  })
})

describe("profileSchema", () => {
  it("accepts valid profile data", () => {
    const result = profileSchema.safeParse({ name: "Juan Pérez" })
    expect(result.success).toBe(true)
  })

  it("accepts profile without name (optional)", () => {
    const result = profileSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe("feedbackSchema", () => {
  it("accepts valid feedback", () => {
    const result = feedbackSchema.safeParse({
      analysisId: "abc123",
      rating: 5,
      comment: "Muy útil",
      wouldRecommend: true,
    })
    expect(result.success).toBe(true)
  })

  it("rejects rating out of range", () => {
    const result = feedbackSchema.safeParse({
      analysisId: "abc123",
      rating: 10,
      wouldRecommend: true,
    })
    expect(result.success).toBe(false)
  })

  it("accepts minimal feedback without comment", () => {
    const result = feedbackSchema.safeParse({
      analysisId: "abc123",
      rating: 3,
      wouldRecommend: false,
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing analysisId", () => {
    const result = feedbackSchema.safeParse({
      rating: 3,
      wouldRecommend: false,
    })
    expect(result.success).toBe(false)
  })
})

describe("clinicSchema", () => {
  it("accepts valid clinic data with all fields", () => {
    const result = clinicSchema.safeParse({
      name: "Clínica Dermatológica",
      logo: "https://example.com/logo.png",
      address: "Calle 123",
      phone: "+123456789",
    })
    expect(result.success).toBe(true)
  })

  it("accepts clinic with only name", () => {
    const result = clinicSchema.safeParse({
      name: "Clínica",
    })
    expect(result.success).toBe(true)
  })

  it("rejects clinic without name", () => {
    const result = clinicSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("accepts logo as any string (base64 data URLs included)", () => {
    const result = clinicSchema.safeParse({
      name: "Clínica",
      logo: "data:image/png;base64,iVBOR",
    })
    expect(result.success).toBe(true)
  })
})

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      email: "test@test.com",
      password: "SecurePass1!",
      name: "Test User",
    })
    expect(result.success).toBe(true)
  })

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      email: "test@test.com",
      password: "123",
      name: "Test",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "invalid",
      password: "SecurePass1!",
      name: "Test",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      email: "test@test.com",
      password: "SecurePass1!",
      name: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects extra keys (strict mode)", () => {
    const result = registerSchema.safeParse({
      email: "test@test.com",
      password: "SecurePass1!",
      name: "Test",
      role: "ADMIN",
    })
    expect(result.success).toBe(false)
  })
})

describe("diaryEntrySchema", () => {
  it("accepts valid diary entry", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2026-06-23",
      feeling: 4,
      notes: "Mi piel se siente bien hoy",
    })
    expect(result.success).toBe(true)
  })

  it("accepts entry without notes", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2026-06-23",
      feeling: 3,
    })
    expect(result.success).toBe(true)
  })

  it("rejects feeling below 1", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2026-06-23",
      feeling: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects feeling above 5", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2026-06-23",
      feeling: 6,
    })
    expect(result.success).toBe(false)
  })

  it("rejects non-integer feeling", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2026-06-23",
      feeling: 3.5,
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty date", () => {
    const result = diaryEntrySchema.safeParse({
      date: "",
      feeling: 3,
    })
    expect(result.success).toBe(false)
  })

  it("rejects notes over 500 chars", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2026-06-23",
      feeling: 3,
      notes: "x".repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it("accepts notes at exactly 500 chars", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2026-06-23",
      feeling: 3,
      notes: "x".repeat(500),
    })
    expect(result.success).toBe(true)
  })

  it("rejects extra keys", () => {
    const result = diaryEntrySchema.safeParse({
      date: "2026-06-23",
      feeling: 3,
      extra: "field",
    })
    expect(result.success).toBe(false)
  })
})

describe("challengeCompleteSchema", () => {
  it("accepts valid challenge ID", () => {
    const result = challengeCompleteSchema.safeParse({ challengeId: "abc123" })
    expect(result.success).toBe(true)
  })

  it("rejects empty challengeId", () => {
    const result = challengeCompleteSchema.safeParse({ challengeId: "" })
    expect(result.success).toBe(false)
  })

  it("rejects missing challengeId", () => {
    const result = challengeCompleteSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("rejects extra keys", () => {
    const result = challengeCompleteSchema.safeParse({ challengeId: "abc", extra: true })
    expect(result.success).toBe(false)
  })
})

describe("challengeCreateSchema", () => {
  it("accepts valid challenge data", () => {
    const result = challengeCreateSchema.safeParse({
      title: "New Challenge",
      description: "Do something great",
    })
    expect(result.success).toBe(true)
  })

  it("uses default values for points and frequency", () => {
    const result = challengeCreateSchema.safeParse({
      title: "Test",
      description: "Test desc",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.points).toBe(10)
      expect(result.data.frequency).toBe("weekly")
      expect(result.data.active).toBe(true)
    }
  })

  it("accepts custom points and frequency", () => {
    const result = challengeCreateSchema.safeParse({
      title: "Test",
      description: "Test desc",
      points: 50,
      frequency: "daily",
      active: false,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.points).toBe(50)
      expect(result.data.frequency).toBe("daily")
    }
  })

  it("rejects empty title", () => {
    const result = challengeCreateSchema.safeParse({
      title: "",
      description: "Test",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty description", () => {
    const result = challengeCreateSchema.safeParse({
      title: "Test",
      description: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects points below 1", () => {
    const result = challengeCreateSchema.safeParse({
      title: "Test",
      description: "Test",
      points: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects points above 1000", () => {
    const result = challengeCreateSchema.safeParse({
      title: "Test",
      description: "Test",
      points: 1001,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid frequency", () => {
    const result = challengeCreateSchema.safeParse({
      title: "Test",
      description: "Test",
      frequency: "yearly",
    })
    expect(result.success).toBe(false)
  })

  it("accepts all valid frequencies", () => {
    for (const freq of ["daily", "weekly", "monthly"] as const) {
      const result = challengeCreateSchema.safeParse({
        title: "Test",
        description: "Test",
        frequency: freq,
      })
      expect(result.success).toBe(true)
    }
  })
})
