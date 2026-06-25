import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { getEnv } from "@/lib/env"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  try {
    const body = await req.json()
    const { guideId } = body

    if (!guideId) return error("guideId requerido")

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

    const env = getEnv()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"

    const response = await fetch(`${env.QVAPAY_API_URL}/v2/create_invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "app-id": env.QVAPAY_UUID,
        "app-secret": env.QVAPAY_SECRET,
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

    const data = await response.json()

    if (!response.ok || !data.invoice_id) {
      return error("Error al crear pago", 500)
    }

    await db.digitalProductPurchase.create({
      data: {
        userId: session.user.id,
        digitalProductId: guideId,
        amount: guide.price,
        provider: "qvapay",
        qvapayId: data.invoice_id,
        status: "pending",
      },
    })

    return ok({
      url: data.invoice_url,
      invoiceId: data.invoice_id,
    })
  } catch (e) {
    return serverError(e)
  }
}
