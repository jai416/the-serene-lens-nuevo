import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const savedProducts = await db.userSavedProduct.findMany({
      where: { userId: session.user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    })

    return ok({ savedProducts })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { productId } = await req.json()
    if (!productId) return error("productId es requerido")

    const product = await db.product.findUnique({ where: { id: productId, isActive: true } })
    if (!product) return error("Producto no encontrado", 404)

    await db.userSavedProduct.upsert({
      where: { userId_productId: { userId: session.user.id, productId } },
      update: {},
      create: { userId: session.user.id, productId },
    })

    return ok({ saved: true })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: Request) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { productId } = await req.json()
    if (!productId) return error("productId es requerido")

    await db.userSavedProduct.deleteMany({
      where: { userId: session.user.id, productId },
    })

    return ok({ removed: true })
  } catch (e) {
    return serverError(e)
  }
}
