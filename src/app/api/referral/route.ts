import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { createReferralGroup, getUserReferralGroups } from "@/lib/services/group.service"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  try {
    const groups = await getUserReferralGroups(session.user.id)
    return ok({ groups })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  if (!validateCsrf(req)) return error("CSRF token inválido", 403)
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  try {
    const result = await createReferralGroup(session.user.id)
    return ok(result)
  } catch (e) {
    return serverError(e)
  }
}
