import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const purchases = await db.digitalProductPurchase.findMany({
      where: { userId: session.user.id },
      include: {
        digitalProduct: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            image: true,
            category: true,
            price: true,
            fileUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const guides = purchases.map((p) => ({
      id: p.digitalProduct.id,
      title: p.digitalProduct.title,
      slug: p.digitalProduct.slug,
      description: p.digitalProduct.description,
      image: p.digitalProduct.image,
      category: p.digitalProduct.category,
      price: p.digitalProduct.price,
      purchaseDate: p.createdAt.toISOString(),
      downloadUrl: p.downloadUrl || p.digitalProduct.fileUrl,
    }))

    return ok({ guides })
  } catch (e) {
    return serverError(e)
  }
}
