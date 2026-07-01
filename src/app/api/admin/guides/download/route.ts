import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const url = new URL(request.url)
    const slug = url.searchParams.get("slug")
    if (!slug) return error("slug requerido")

    const guide = await db.digitalProduct.findUnique({ where: { slug } })
    if (!guide) return notFound()

    if (!guide.fileUrl) return error("Esta guía no tiene archivo asociado")

    return ok({ fileUrl: guide.fileUrl, title: guide.title })
  } catch (e) {
    return serverError(e)
  }
}
