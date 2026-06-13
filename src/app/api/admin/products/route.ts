import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest } from "next/server"
import { ok, unauthorized, serverError } from "@/lib/api-response"

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

    const data = await req.json()

    const product = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDesc: data.shortDesc || null,
        image: data.image || "",
        category: data.category,
        skinTypes: data.skinTypes || "all",
        price: data.price || 0,
        ingredients: data.ingredients || null,
        isActive: data.isActive ?? true,
      },
    })

    return ok({ product })
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const { id, ...data } = await req.json()

    const product = await db.product.update({
      where: { id },
      data,
    })

    return ok({ product })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const { id } = await req.json()

    await db.product.delete({ where: { id } })

    return ok({ deleted: true })
  } catch (e) {
    return serverError(e)
  }
}
