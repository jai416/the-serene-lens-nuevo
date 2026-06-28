import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    if (session.user.plan !== "ESTHETICIAN" && session.user.role !== "ADMIN") {
      return error("Plan Esteticista requerido", 403)
    }

    const clients = await db.client.findMany({
      where: { estheticianId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return ok({ clients })
  } catch (e) {
    logger.error("Get clients error", { error: e instanceof Error ? e.message : "Unknown" })
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    if (session.user.plan !== "ESTHETICIAN" && session.user.role !== "ADMIN") {
      return error("Plan Esteticista requerido", 403)
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo inválido")
    }

    const { name, email, phone, notes } = body as {
      name?: string
      email?: string
      phone?: string
      notes?: string
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return error("Nombre requerido (mínimo 2 caracteres)")
    }

    const clientCount = await db.client.count({
      where: { estheticianId: session.user.id },
    })

    if (clientCount >= 50 && session.user.role !== "ADMIN") {
      return error("Límite de 50 clientes alcanzado. Upgrade tu plan.")
    }

    const client = await db.client.create({
      data: {
        estheticianId: session.user.id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
      },
    })

    logger.info("Client created", { estheticianId: session.user.id, clientId: client.id })

    return ok({ client })
  } catch (e) {
    logger.error("Create client error", { error: e instanceof Error ? e.message : "Unknown" })
    return serverError(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    if (session.user.plan !== "ESTHETICIAN" && session.user.role !== "ADMIN") {
      return error("Plan Esteticista requerido", 403)
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo inválido")
    }

    const { clientId } = body as { clientId?: string }

    if (!clientId || typeof clientId !== "string") {
      return error("clientId requerido")
    }

    const client = await db.client.findFirst({
      where: { id: clientId, estheticianId: session.user.id },
    })

    if (!client) return error("Cliente no encontrado", 404)

    await db.client.delete({ where: { id: clientId } })

    return ok({ deleted: true })
  } catch (e) {
    logger.error("Delete client error", { error: e instanceof Error ? e.message : "Unknown" })
    return serverError(e)
  }
}
