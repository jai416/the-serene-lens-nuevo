import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { joinReferralGroup, getGroupInfo } from "@/lib/services/group.service"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  try {
    const group = await getGroupInfo(code)
    if (!group) return error("Grupo no encontrado", 404)
    return ok(group)
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!validateCsrf(req)) return error("CSRF token inválido", 403)
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  const { code } = await params

  try {
    const result = await joinReferralGroup(code, session.user.id)
    if (!result.success) return error(result.error || "Error al unirse al grupo", 400)
    return ok(result)
  } catch (e) {
    return serverError(e)
  }
}
