import { ok, serverError } from "@/lib/api-response"

export async function POST() {
  try {
    const sessionId = crypto.randomUUID()
    return ok({ sessionId })
  } catch (e) {
    return serverError(e)
  }
}
