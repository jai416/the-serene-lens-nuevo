import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { z } from "zod"
import { revalidateTag } from "next/cache"

const guideCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  shortDesc: z.string().optional(),
  image: z.string().url(),
  category: z.string().min(1),
  price: z.number().positive(),
  fileUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const guides = await db.digitalProduct.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { purchases: true } } },
    })

    return ok({ guides })
  } catch (e) {
    logger.error("Admin guides GET error:", e)
    return serverError(e)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const body = await request.json()
    const { allowed } = await checkRateLimit(`admin:guides:${session.user.id}`, 30, 60000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    }
    const parsed = guideCreateSchema.safeParse(body)
    if (!parsed.success) {
      return error("Datos inválidos", 400)
    }

    const guide = await db.digitalProduct.create({ data: parsed.data })
    revalidateTag("guides")

    return ok({ guide })
  } catch (e) {
    logger.error("Admin guides POST error:", e)
    return serverError(e)
  }
}
