import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { DiaryService, DiaryError } from "@/lib/services/diary.service"
import { diaryEntrySchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("Debes iniciar sesión", 401)

    const entries = await DiaryService.getEntries(session.user.id)
    return ok(entries)
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("Debes iniciar sesión", 401)

    const parsed = diaryEntrySchema.safeParse(await req.json())
    if (!parsed.success) {
      return error("Datos inválidos: " + parsed.error.issues.map((i) => i.message).join(", "))
    }

    const entry = await DiaryService.upsertEntry(
      session.user.id,
      parsed.data.date,
      parsed.data.feeling,
      parsed.data.notes
    )

    return ok(entry, 201)
  } catch (e) {
    if (e instanceof DiaryError) {
      const statusMap: Record<string, number> = { FUTURE_DATE: 400, NOT_FOUND: 404, UNAUTHORIZED: 403 }
      return error(e.message, statusMap[e.code] || 400)
    }
    return serverError(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("Debes iniciar sesión", 401)

    const { searchParams } = new URL(req.url)
    const entryId = searchParams.get("id")
    if (!entryId) return error("Se requiere el id de la entrada")

    await DiaryService.deleteEntry(session.user.id, entryId)
    return ok({ deleted: true })
  } catch (e) {
    if (e instanceof DiaryError) {
      const statusMap: Record<string, number> = { NOT_FOUND: 404, UNAUTHORIZED: 403 }
      return error(e.message, statusMap[e.code] || 400)
    }
    return serverError(e)
  }
}
