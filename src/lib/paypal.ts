const PAYPAL_API = process.env.PAYPAL_SANDBOX === "true"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com"

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ""
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ""

let accessToken: string | null = null
let tokenExpiresAt = 0

export async function getPayPalAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal auth failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  accessToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000
  return accessToken!
}

export interface PayPalOrderOptions {
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
  invoiceId?: string
}

export async function createPayPalOrder(opts: PayPalOrderOptions) {
  const token = await getPayPalAccessToken()

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: opts.amount.toFixed(2),
          },
          description: opts.description,
          invoice_id: opts.invoiceId || undefined,
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: opts.returnUrl,
            cancel_url: opts.cancelUrl,
          },
        },
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal create order failed: ${res.status} ${text}`)
  }

  const order = await res.json()
  const approvalUrl = order.links?.find((l: any) => l.rel === "payer-action")?.href

  if (!approvalUrl) {
    throw new Error("No approval URL in PayPal response")
  }

  return { orderId: order.id, approvalUrl, status: order.status }
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getPayPalAccessToken()

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal capture failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0]

  return {
    status: data.status,
    captureId: capture?.id || null,
    amount: capture?.amount?.value ? parseFloat(capture.amount.value) : 0,
    completed: data.status === "COMPLETED",
  }
}

export async function verifyPayPalOrder(orderId: string) {
  const token = await getPayPalAccessToken()

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal verify failed: ${res.status} ${text}`)
  }

  return res.json()
}
