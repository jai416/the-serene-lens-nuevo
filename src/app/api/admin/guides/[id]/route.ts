import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { revalidateTag } from "next/cache"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:guides:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

    const { id } = await params
    const body = await request.json()
    const guide = await db.digitalProduct.findUnique({ where: { id } })
    if (!guide) return notFound()

    const updated = await db.digitalProduct.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.shortDesc !== undefined && { shortDesc: body.shortDesc }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    revalidateTag("guides")
    return ok({ guide: updated })
  } catch (e) {
    logger.error("Admin guide PATCH error:", e)
    return serverError(e)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:guides:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

    const { id } = await params
    const guide = await db.digitalProduct.findUnique({ where: { id } })
    if (!guide) return notFound()

    await db.digitalProduct.delete({ where: { id } })
    revalidateTag("guides")
    return ok({ deleted: true })
  } catch (e) {
    logger.error("Admin guide DELETE error:", e)
    return serverError(e)
  }
}
