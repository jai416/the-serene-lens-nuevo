import { db } from "@/lib/db"
import { ok, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const guides = await db.digitalProduct.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        shortDesc: true,
        image: true,
        category: true,
        price: true,
        fileUrl: true,
      },
    })

    return ok({ guides })
  } catch (e) {
    return serverError(e)
  }
}
