import { logger } from "@/lib/logger"

const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.paypal.com"

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured")
  }
  const res = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "unknown")
    throw new Error(`PayPal auth error ${res.status}: ${text}`)
  }
  const data = await res.json()
  return data.access_token
}

export async function createPayPalOrder(options: {
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
  intent?: "CAPTURE" | "AUTHORIZE"
}): Promise<{ id: string; approvalUrl: string }> {
  const token = await getAccessToken()
  const body = {
    intent: options.intent || "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: "USD",
        value: options.amount.toFixed(2),
      },
      description: options.description,
    }],
    payment_source: {
      paypal: {
        experience_context: {
          return_url: options.returnUrl,
          cancel_url: options.cancelUrl,
          user_action: "PAY_NOW",
        },
      },
    },
  }

  const res = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown")
    logger.error("PayPal create order error", { status: res.status, body: text.slice(0, 500) })
    throw new Error(`Error al crear orden en PayPal (${res.status})`)
  }

  const data = await res.json()
  const approvalLink = data.links?.find((l: { rel: string }) => l.rel === "payer-action")?.href
  if (!approvalLink) {
    throw new Error("PayPal no devolvió un enlace de aprobación")
  }

  return { id: data.id, approvalUrl: approvalLink }
}

export async function capturePayPalOrder(orderId: string): Promise<{ status: string; id: string }> {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown")
    logger.error("PayPal capture error", { orderId, status: res.status, body: text.slice(0, 500) })
    throw new Error(`Error al capturar pago en PayPal (${res.status})`)
  }

  const data = await res.json()
  const captureStatus = data.status
  const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId

  return { status: captureStatus, id: captureId }
}

export async function verifyPayPalOrder(orderId: string): Promise<{ status: string; amount: number }> {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown")
    logger.error("PayPal verify error", { orderId, status: res.status, body: text.slice(0, 500) })
    throw new Error(`Error al verificar orden en PayPal (${res.status})`)
  }

  const data = await res.json()
  const amount = parseFloat(data.purchase_units?.[0]?.amount?.value || "0")
  return { status: data.status, amount }
}

export function isPaypalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
}
