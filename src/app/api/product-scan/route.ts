import { NextRequest } from "next/server"
import { scanProductIngredients } from "@/lib/openrouter"
import { ok, error, serverError } from "@/lib/api-response"

const alarmistTerms = [
  "tóxico", "toxina", "veneno", "venenoso", "cancerígeno", "carcinógeno",
  "mortal", "peligroso", "dañino", "nocivo", "letal",
]

function sanitizeSummary(summary: string): string {
  let sanitized = summary
  alarmistTerms.forEach((term) => {
    const regex = new RegExp(term, "gi")
    sanitized = sanitized.replace(regex, (match) => `[${match}]`)
  })
  return sanitized
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null

    if (!file) return error("Imagen requerida")

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    const result = await scanProductIngredients(base64)

    if (result.summary) {
      result.summary = sanitizeSummary(result.summary as string)
    }

    return ok({ result })
  } catch (e) {
    return serverError(e)
  }
}
