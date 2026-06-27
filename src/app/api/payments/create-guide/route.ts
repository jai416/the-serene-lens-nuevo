import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido")
    }

    const { guideId } = body as { guideId?: string }

    if (!guideId || typeof guideId !== "string") return error("guideId requerido")

    const guide = await db.digitalProduct.findUnique({
      where: { id: guideId, isActive: true },
    })

    if (!guide) return error("Guía no encontrada", 404)

    const existingPurchase = await db.digitalProductPurchase.findFirst({
      where: {
        userId: session.user.id,
        digitalProductId: guideId,
        status: "completed",
      },
    })

    if (existingPurchase) {
      return ok({
        alreadyPurchased: true,
        downloadUrl: existingPurchase.downloadUrl,
        message: "Ya has comprado esta guía.",
      })
    }

    const QVAPAY_API_URL = process.env.QVAPAY_API_URL || "https://api.qvapay.com"
    const QVAPAY_UUID = process.env.QVAPAY_UUID || ""
    const QVAPAY_SECRET = process.env.QVAPAY_SECRET || ""
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

    if (!QVAPAY_UUID || !QVAPAY_SECRET) {
      return error("Sistema de pagos no configurado. Contacta al soporte.", 503)
    }

    let qvapayData: Record<string, unknown>
    try {
      const response = await fetch(`${QVAPAY_API_URL}/v2/create_invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "app-id": QVAPAY_UUID,
          "app-secret": QVAPAY_SECRET,
        },
        body: JSON.stringify({
          title: guide.title,
          description: `Guía: ${guide.title}`,
          amount: guide.price,
          currency: "USD",
          reference_id: `guide-${guideId}-${session.user.id}`,
          success_url: `${appUrl}/guides?success=${guideId}`,
          cancel_url: `${appUrl}/guides`,
        }),
      })

      const text = await response.text()
      logger.info("QvaPay guide response", { status: response.status, body: text })

      try {
        qvapayData = JSON.parse(text)
      } catch {
        logger.error("QvaPay guide invalid JSON", { body: text })
        return error("Respuesta inválida del procesador de pagos")
      }

      if (!response.ok || !qvapayData.invoice_id) {
        logger.error("QvaPay guide create failed", { status: response.status, data: qvapayData })
        return error("Error al crear pago en el procesador")
      }
    } catch (e) {
      logger.error("QvaPay guide fetch error", { error: e instanceof Error ? e.message : "Unknown" })
      return error("No se pudo conectar con el procesador de pagos")
    }

    try {
      await db.digitalProductPurchase.create({
        data: {
          userId: session.user.id,
          digitalProductId: guideId,
          amount: guide.price,
          provider: "qvapay",
          qvapayId: qvapayData.invoice_id as string,
          status: "pending",
        },
      })
    } catch (e) {
      logger.error("DB save guide purchase error", { error: e instanceof Error ? e.message : "Unknown" })
    }

    return ok({
      url: qvapayData.invoice_url,
      invoiceId: qvapayData.invoice_id,
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Error al procesar el pago" },
      { status: 500 }
    )
  }
}
