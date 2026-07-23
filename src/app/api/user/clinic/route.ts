import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, forbidden, serverError, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { validateCsrf } from "@/lib/csrf-middleware"
import { uploadImage, isConfigured as cloudinaryConfigured } from "@/lib/cloudinary"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const clinic = await db.clinic.findUnique({
      where: { ownerId: session.user.id },
    })

    const analyses = await db.skinAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, skinType: true, createdAt: true },
    })

    return ok({ clinic, analyses })
  } catch (e) {
    logger.error("clinic GET error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const { name, address, phone, logo, licenseNumber } = body

    const existing = await db.clinic.findUnique({ where: { ownerId: session.user.id } })

    const data: any = {}
    if (name !== undefined) data.name = name
    if (phone !== undefined) data.phone = phone
    if (address !== undefined) data.address = address
    if (licenseNumber !== undefined) data.licenseNumber = licenseNumber

    if (logo !== undefined) {
      if (typeof logo === "string" && logo.startsWith("data:image")) {
        if (cloudinaryConfigured()) {
          const result = await uploadImage(logo, { folder: "the-serene-lens/logos" })
          data.logo = result?.url || logo
        } else {
          data.logo = logo
        }
      } else {
        data.logo = logo
      }
    }

    const clinic = existing
      ? await db.clinic.update({ where: { ownerId: session.user.id }, data })
      : await db.clinic.create({
          data: {
            ...data,
            ownerId: session.user.id,
            name: name || "Mi Clínica",
            slug: `clinic-${session.user.id}`,
            referralCode: `EST-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
          },
        })

    return ok({ clinic })
  } catch (e) {
    logger.error("clinic PUT error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
