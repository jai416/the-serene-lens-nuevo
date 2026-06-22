import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const clinic = await db.clinic.findUnique({
      where: { ownerId: session.user.id },
    })

    const analyses = await db.skinAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, skinType: true, createdAt: true },
    })

    return NextResponse.json({ clinic, analyses })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
