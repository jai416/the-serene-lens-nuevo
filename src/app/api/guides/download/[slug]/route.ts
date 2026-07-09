import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { unauthorized, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import fs from "fs/promises"
import path from "path"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const guide = await db.digitalProduct.findUnique({
      where: { slug },
      select: { id: true, title: true, fileUrl: true },
    })
    if (!guide || !guide.fileUrl) return error("Guía no encontrada", 404)

    const purchase = await db.digitalProductPurchase.findFirst({
      where: { userId: session.user.id, digitalProductId: guide.id, status: "completed" },
    })
    if (!purchase) return error("No has comprado esta guía", 403)

    const filePath = path.join(process.cwd(), guide.fileUrl)
    try {
      await fs.access(filePath)
    } catch {
      logger.error("Guide file not found on disk", { slug, fileUrl: guide.fileUrl })
      return error("Archivo no disponible temporalmente", 503)
    }

    const fileBuffer = await fs.readFile(filePath)
    const filename = `${guide.title.replace(/[^a-zA-Z0-9\s-]/g, "")}.pdf`

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    })
  } catch (e) {
    logger.error("Guide download error:", { error: e instanceof Error ? e.message : String(e) })
    return error("Error al descargar la guía", 500)
  }
}
