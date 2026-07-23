import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { ChallengeService, ChallengeError } from "@/lib/services/challenge.service"
import { challengeCompleteSchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("Debes iniciar sesión", 401)

    const data = await ChallengeService.getActiveChallenges(session.user.id)
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("Debes iniciar sesión", 401)

    const parsed = challengeCompleteSchema.safeParse(await req.json())
    if (!parsed.success) {
      return error("Datos inválidos: " + parsed.error.issues.map((i) => i.message).join(", "))
    }

    const result = await ChallengeService.completeChallenge(session.user.id, parsed.data.challengeId)
    return ok(result)
  } catch (e) {
    if (e instanceof ChallengeError) {
      const statusMap: Record<string, number> = { NOT_FOUND: 404, INACTIVE: 400, ALREADY_COMPLETED: 409 }
      return error(e.message, statusMap[e.code] || 400)
    }
    return serverError(e)
  }
}
