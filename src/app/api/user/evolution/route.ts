import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserService } from "@/lib/services/user.service"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })
    }

    if ((session.user as any).plan === "FREE") {
      return NextResponse.json({ success: false, error: { code: "UPGRADE_REQUIRED", message: "Actualiza tu plan para ver evolución" } }, { status: 403 })
    }

    const evolution = await UserService.getEvolution(session.user.id)
    return NextResponse.json(evolution)
  } catch {
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 })
  }
}
