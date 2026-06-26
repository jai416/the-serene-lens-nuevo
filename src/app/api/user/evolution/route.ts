import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserService } from "@/lib/services/user.service"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return unauthorized()
    }

    if ((session.user as any).plan === "FREE") {
      return error("Actualiza tu plan para ver evolución", 403)
    }

    const evolution = await UserService.getEvolution(session.user.id)
    return ok(evolution)
  } catch {
    return serverError()
  }
}
