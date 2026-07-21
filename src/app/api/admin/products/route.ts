import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { adminProductSchema, adminProductUpdateSchema, adminDeleteSchema } from "@/lib/validations"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
    })

    return ok({ products })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const body = await req.json()
    const { allowed } = await checkRateLimit(`admin:products:${admin.id}`, 30, 60000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    }
    const parsed = adminProductSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const data = parsed.data
    const product = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDesc: data.shortDesc || null,
        image: data.image || "",
        category: data.category,
        skinTypes: data.skinTypes || "all",
        ingredients: data.ingredients || null,
        isActive: data.isActive ?? true,
      },
    })

    revalidateTag("products-catalog")

    return ok({ product })
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const body = await req.json()
    const { allowed } = await checkRateLimit(`admin:products:${admin.id}`, 30, 60000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    }
    const parsed = adminProductUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const { id, ...data } = parsed.data

    const product = await db.product.update({
      where: { id },
      data,
    })

    revalidateTag("products-catalog")

    return ok({ product })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const body = await req.json()
    const { allowed } = await checkRateLimit(`admin:products:${admin.id}`, 30, 60000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    }
    const parsed = adminDeleteSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    await db.product.delete({ where: { id: parsed.data.id } })

    revalidateTag("products-catalog")

    return ok({ deleted: true })
  } catch (e) {
    return serverError(e)
  }
}
