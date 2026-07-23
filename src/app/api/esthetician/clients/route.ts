import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.plan !== "ESTHETICIAN") return forbidden()

    const clinic = await db.clinic.findUnique({ where: { ownerId: session.user.id } })
    if (!clinic) return ok({ clients: [] })

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")))
    const search = url.searchParams.get("search") || ""

    const where: any = { clinicId: clinic.id }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        include: { _count: { select: { analyses: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.client.count({ where }),
    ])

    return ok({ clients, total, totalPages: Math.ceil(total / limit), page })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.plan !== "ESTHETICIAN") return forbidden()

    const clinic = await db.clinic.findUnique({ where: { ownerId: session.user.id } })
    if (!clinic) return error("Debes crear tu perfil de clínica primero")

    const clientCount = await db.client.count({ where: { clinicId: clinic.id } })
    if (clientCount >= 200) return error("Has alcanzado el límite de 200 clientes")

    const { name, email, phone, notes } = await req.json()
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return error("El nombre del cliente es obligatorio")
    }

    const client = await db.client.create({
      data: {
        estheticianId: session.user.id,
        clinicId: clinic.id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
      },
    })

    return ok({ client }, 201)
  } catch (e) {
    return serverError(e)
  }
}
