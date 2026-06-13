import { NextRequest } from "next/server"
import { contactSchema } from "@/lib/validation"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message || "Datos inválidos")
    }

    const message = await db.contactMessage.create({
      data: parsed.data,
    })

    return ok({ message: "Mensaje enviado correctamente" })
  } catch (e) {
    return serverError(e)
  }
}
