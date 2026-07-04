import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAllFeatureFlags, setFeatureFlag } from "@/lib/feature-flags"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const flags = await getAllFeatureFlags()
    return ok({ flags })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const body = await req.json().catch(() => null)
    if (!body?.flag) return error("Se requiere 'flag' (string)")

    const config = {
      enabled: body.enabled !== undefined ? body.enabled : true,
      message: body.message || undefined,
      redirectUrl: body.redirectUrl || undefined,
    }

    await setFeatureFlag(body.flag, config)
    return ok({ flag: body.flag, ...config })
  } catch (e) {
    return serverError(e)
  }
}
