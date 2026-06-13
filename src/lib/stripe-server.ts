import { getStripeClient } from "@/lib/stripe"

let _stripe: ReturnType<typeof getStripeClient> | null = null

function getStripe() {
  if (!_stripe) {
    _stripe = getStripeClient()
  }
  return _stripe
}

const PRICE_IDS: Record<string, string | undefined> = {
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID,
  PRO: process.env.STRIPE_PRO_PRICE_ID,
  BASIC: process.env.STRIPE_BASIC_PACK_PRICE_ID,
  POPULAR: process.env.STRIPE_POPULAR_PACK_PRICE_ID,
  ADVANCED: process.env.STRIPE_ADVANCED_PACK_PRICE_ID,
}

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function createSubscriptionCheckoutSession(params: {
  priceId: string
  userId: string
  email: string
  plan: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: params.email,
    line_items: [{ price: params.priceId, quantity: 1 }],
    metadata: { userId: params.userId, plan: params.plan },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  })
  return session
}

export async function createPackCheckoutSession(params: {
  priceId: string
  userId: string
  email: string
  packType: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: params.email,
    line_items: [{ price: params.priceId, quantity: 1 }],
    metadata: { userId: params.userId, packType: params.packType },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  })
  return session
}

export function getPriceId(id: string): string | undefined {
  return PRICE_IDS[id]
}

export async function constructWebhookEvent(
  payload: string,
  signature: string,
) {
  return getStripe().webhooks.constructEventAsync(payload, signature, WEBHOOK_SECRET)
}

export function getStripeInstance() {
  return getStripe()
}
