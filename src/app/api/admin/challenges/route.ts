import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { challengeCreateSchema } from "@/lib/validations"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

  const challenges = await db.challenge.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { userChallenges: true } },
    },
  })

  return ok({ challenges })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

  const parsed = challengeCreateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return error("Datos inválidos: " + parsed.error.issues.map((i) => i.message).join(", "))
  }

  const challenge = await db.challenge.create({ data: parsed.data })
  return ok(challenge, 201)
}
