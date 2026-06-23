import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"
import { z } from "zod"

const createSchema = z.object({
  date: z.string().min(1),
  feeling: z.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return error("Debes iniciar sesión", 401)
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const entries = await db.skinDiary.findMany({
      where: {
        userId: session.user.id,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        feeling: true,
        notes: true,
        createdAt: true,
      },
    })

    return ok(entries)
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return error("Debes iniciar sesión", 401)
    }

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return error("Datos inválidos: " + parsed.error.issues.map((i) => i.message).join(", "))
    }

    const { date, feeling, notes } = parsed.data
    const entryDate = new Date(date)
    entryDate.setHours(0, 0, 0, 0)

    const entry = await db.skinDiary.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: entryDate,
        },
      },
      update: { feeling, notes },
      create: {
        userId: session.user.id,
        date: entryDate,
        feeling,
        notes,
      },
      select: {
        id: true,
        date: true,
        feeling: true,
        notes: true,
        createdAt: true,
      },
    })

    return ok(entry, 201)
  } catch (e) {
    return serverError(e)
  }
}
