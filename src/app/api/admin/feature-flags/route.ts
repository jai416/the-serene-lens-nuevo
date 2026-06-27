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
    console.error("Feature flags GET error:", e)
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const body = await req.json().catch(() => null)
    if (!body?.flag || typeof body.enabled !== "boolean") {
      return error("Se requiere 'flag' (string) y 'enabled' (boolean)")
    }

    await setFeatureFlag(body.flag, body.enabled)
    return ok({ flag: body.flag, enabled: body.enabled })
  } catch (e) {
    console.error("Feature flags POST error:", e)
    return serverError(e)
  }
}
