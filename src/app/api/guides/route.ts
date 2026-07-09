import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { serverError } from "@/lib/api-response"

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
      },
    })

    return NextResponse.json({ success: true, data: { guides } }, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    })
  } catch (e) {
    return serverError(e)
  }
}
