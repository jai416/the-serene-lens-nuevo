import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return unauthorized()
    }

    const userCount = await db.user.count()
    const users = await db.user.findMany({
      take: 5,
      select: { id: true, email: true, name: true, role: true, plan: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })

    let analysisCount = 0
    try { analysisCount = await db.skinAnalysis.count() } catch { analysisCount = -1 }

    let paymentCount = 0
    try { paymentCount = await db.payment.count() } catch { paymentCount = -1 }

    return ok({
      userCount,
      users,
      analysisCount,
      paymentCount,
    })
  } catch (e) {
    return serverError(e)
  }
}
