import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"
import { constructWebhookEvent } from "@/lib/stripe-server"
import { CUP_RATE } from "@/lib/pricing"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      return error("Firma requerida")
    }

    let event
    try {
      event = await constructWebhookEvent(body, signature)
    } catch {
      return error("Firma inválida")
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const metadata = session.metadata || {}
        const userId = metadata.userId
        const plan = metadata.plan
        const packType = metadata.packType

        if (!userId) return ok({ received: true })

        if (plan) {
          await db.payment.create({
            data: {
              userId,
              provider: "stripe",
              stripePaymentId: session.id,
              plan,
              amount: (session.amount_total || 0) / 100,
              amountUsd: (session.amount_total || 0) / 100,
              status: "completed",
              confirmedAt: new Date(),
            },
          })

          await db.user.update({
            where: { id: userId },
            data: { plan },
          })

          await db.subscription.create({
            data: {
              userId,
              provider: "stripe",
              stripeSubscriptionId: session.subscription as string,
              plan,
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          })
        }

        if (packType) {
          const packAnalyses: Record<string, number> = {
            BASIC: 3,
            POPULAR: 5,
            ADVANCED: 15,
          }
          const analyses = packAnalyses[packType] || 0

          const amountUsd = (session.amount_total || 0) / 100
          await db.purchasePack.create({
            data: {
              userId,
              packType,
              provider: "stripe",
              amountUsd,
              amountCup: amountUsd * CUP_RATE,
              analyses,
              status: "completed",
            },
          })

          await db.payment.create({
            data: {
              userId,
              provider: "stripe",
              stripePaymentId: session.id,
              plan: packType,
              amount: (session.amount_total || 0) / 100,
              amountUsd: (session.amount_total || 0) / 100,
              status: "completed",
              confirmedAt: new Date(),
            },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const stripeSubId = subscription.id

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubId },
          data: { status: "canceled" },
        })

        const existing = await db.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
          select: { userId: true },
        })

        if (existing) {
          await db.user.update({
            where: { id: existing.userId },
            data: { plan: "FREE" },
          })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as { subscription: string | null }
        const stripeSubId = invoice.subscription

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubId },
          data: { status: "past_due" },
        })
        break
      }
    }

    return ok({ received: true })
  } catch (e) {
    return serverError(e)
  }
}
