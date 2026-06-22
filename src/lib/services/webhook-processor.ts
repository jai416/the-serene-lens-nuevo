import type { WebhookEvent } from "@/generated/prisma/client"

export async function processWebhookByProvider(event: WebhookEvent): Promise<void> {
  switch (event.provider) {
    case "stripe":
      await processStripeEvent(event)
      break
    case "qvapay":
      await processQvaPayEvent(event)
      break
    default:
      throw new Error(`Unknown webhook provider: ${event.provider}`)
  }
}

async function processStripeEvent(event: WebhookEvent): Promise<void> {
  const { getStripeInstance } = await import("@/lib/stripe-server")
  const stripe = getStripeInstance()
  const payload = JSON.parse(event.payload)

  switch (event.eventType) {
    case "checkout.session.completed": {
      const session = payload.data?.object
      if (!session?.client_reference_id) throw new Error("No user ID")

      const { db } = await import("@/lib/db")
      const plan = session.metadata?.plan || session.metadata?.packType

      if (plan) {
        const { handleSuccessfulPlanPayment } = await import("@/lib/services/payment.service")
        await handleSuccessfulPlanPayment(session.client_reference_id, plan, "stripe", {
          stripePaymentId: session.id,
          amount: session.amount_total ? session.amount_total / 100 : 0,
        })
      }
      break
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = payload.data?.object
      if (!subscription?.metadata?.userId) throw new Error("No user ID in subscription metadata")

      const { db } = await import("@/lib/db")
      const status = subscription.status === "active" ? "active" : "canceled"

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status },
      })
      break
    }
    default:
      return
  }
}

async function processQvaPayEvent(event: WebhookEvent): Promise<void> {
  const payload = JSON.parse(event.payload)
  const { db } = await import("@/lib/db")

  const payment = await db.payment.findUnique({
    where: { qvapayId: payload.payment_id },
  })

  if (!payment) throw new Error("Payment not found")

  if (payload.status === "completed") {
    const { handleSuccessfulPlanPayment } = await import("@/lib/services/payment.service")
    await handleSuccessfulPlanPayment(payment.userId, payment.plan, "qvapay", {
      qvapayId: payload.payment_id,
      amount: payment.amount,
    })
  }
}
