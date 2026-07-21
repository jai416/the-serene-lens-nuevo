import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserService } from "@/lib/services/user.service"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return unauthorized()
    }

    const evolution = await UserService.getEvolution(session.user.id)
    return ok(evolution)
  } catch (e) {
    return serverError(e)
  }
}
