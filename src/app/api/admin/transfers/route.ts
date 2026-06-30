import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, forbidden, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.role !== "ADMIN" && session.user.role !== "VALIDATOR") return forbidden()

    const transfers = await db.transferPayment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        validator: { select: { name: true } },
        activator: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return ok(transfers)
  } catch (e) {
    return serverError(e)
  }
}
