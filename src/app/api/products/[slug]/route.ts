import { db } from "@/lib/db"
import { ok, notFound, serverError } from "@/lib/api-response"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const product = await db.product.findUnique({
      where: { slug },
    })

    if (!product) return notFound("Producto no encontrado")

    return ok({ product })
  } catch (e) {
    return serverError(e)
  }
}
