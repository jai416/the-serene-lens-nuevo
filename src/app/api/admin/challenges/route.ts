import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { challengeCreateSchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const challenges = await db.challenge.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { userChallenges: true } },
      },
    })

    return ok({ challenges })
  } catch (e) {
    console.error("Challenges GET error:", e)
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const parsed = challengeCreateSchema.safeParse(await req.json())
    const { allowed } = await checkRateLimit(`admin:challenges:${session.user.id}`, 30, 60000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    }
    if (!parsed.success) {
      return error("Datos inválidos: " + parsed.error.issues.map((i) => i.message).join(", "))
    }

    const challenge = await db.challenge.create({ data: parsed.data })
    return ok(challenge, 201)
  } catch (e) {
    console.error("Challenges POST error:", e)
    return serverError(e)
  }
}
