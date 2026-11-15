import { NextRequest } from "next/server"
import { ok, serverError, error } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const sessionId = crypto.randomUUID()
    return ok({ sessionId })
  } catch (e) {
    return serverError(e)
  }
}
