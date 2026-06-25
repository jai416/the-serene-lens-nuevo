import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "not admin" }, { status: 401 })
    }

    const userCount = await db.user.count()
    const users = await db.user.findMany({
      take: 5,
      select: { id: true, email: true, name: true, role: true, plan: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })

    let analysisCount = 0
    try { analysisCount = await db.skinAnalysis.count() } catch (e: any) { analysisCount = -1 }

    let paymentCount = 0
    try { paymentCount = await db.payment.count() } catch (e: any) { paymentCount = -1 }

    return NextResponse.json({
      ok: true,
      userCount,
      users,
      analysisCount,
      paymentCount,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
