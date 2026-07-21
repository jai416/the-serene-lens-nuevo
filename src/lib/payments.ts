import { logger } from "@/lib/logger"

const QVAPAY_TIMEOUT = 25000
const QVAPAY_USER_AGENT = `TheSereneLens/3.0 (+${process.env.NEXT_PUBLIC_APP_URL || "https://the-serene-lens-nuevo.onrender.com"})`

function getPaymentsEnv() {
  const QVAPAY_API_URL = process.env.QVAPAY_API_URL || "https://api.qvapay.com"
  const QVAPAY_UUID = process.env.QVAPAY_UUID || ""
  const QVAPAY_SECRET = process.env.QVAPAY_SECRET || ""
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

  if (!QVAPAY_UUID || !QVAPAY_SECRET) {
    throw new Error("QvaPay credentials not configured")
  }

  return { QVAPAY_API_URL, QVAPAY_UUID, QVAPAY_SECRET, NEXTAUTH_URL }
}

function qvapayHeaders(uuid: string, secret: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "app-id": uuid,
    "app-secret": secret,
    "User-Agent": QVAPAY_USER_AGENT,
    Accept: "application/json",
  }
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 1): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options)
      return res
    } catch (err) {
      const isLast = attempt === retries
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[QvaPay] attempt ${attempt + 1}/${retries + 1} failed: ${msg}`)
      if (isLast) throw err
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  throw new Error("fetchWithRetry exhausted")
}

interface CreateQvaPayOptions {
  amount: number
  description: string
  plan: string
  userId: string
}

async function createInvoice(body: Record<string, string | number>) {
  const e = getPaymentsEnv()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), QVAPAY_TIMEOUT)
  try {
    const res = await fetchWithRetry(
      `${e.QVAPAY_API_URL}/v2/create_invoice`,
      {
        method: "POST",
        headers: qvapayHeaders(e.QVAPAY_UUID, e.QVAPAY_SECRET),
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    )
    if (!res.ok) {
      const responseBody = await res.text().catch(() => "")
      console.error("[QvaPay] create_invoice failed:", res.status, responseBody)
      throw new Error("Error al crear pago en QvaPay")
    }
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function createQvaPayPayment({ amount, description, plan, userId }: CreateQvaPayOptions) {
  const e = getPaymentsEnv()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || e.NEXTAUTH_URL
  return createInvoice({
    amount,
    description,
    remote_id: `${userId}_${plan}_${Date.now()}`,
    webhook: `${e.NEXTAUTH_URL}/api/payments/webhook`,
    success_url: `${appUrl}/pricing/success?payment_id={invoice_id}`,
    cancel_url: `${appUrl}/pricing/cancel`,
  })
}

export async function createQvaPayPackPayment({ amount, description, packType, userId }: CreateQvaPayOptions & { packType: string }) {
  const e = getPaymentsEnv()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || e.NEXTAUTH_URL
  return createInvoice({
    amount,
    description,
    remote_id: `${userId}_pack_${packType}_${Date.now()}`,
    webhook: `${e.NEXTAUTH_URL}/api/payments/webhook`,
    success_url: `${appUrl}/pricing/success?payment_id={invoice_id}`,
    cancel_url: `${appUrl}/pricing/cancel`,
  })
}

export async function getQvaPayPaymentStatus(transactionUuid: string) {
  const e = getPaymentsEnv()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), QVAPAY_TIMEOUT)
  try {
    const res = await fetch(`${e.QVAPAY_API_URL}/v2/transaction/${transactionUuid}`, {
      method: "GET",
      headers: {
        "app-id": e.QVAPAY_UUID,
        "app-secret": e.QVAPAY_SECRET,
        "User-Agent": QVAPAY_USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error("Error al verificar pago")
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export function getPaymentError(provider: string, error: unknown): string {
  return "No pudimos procesar el pago. Intenta de nuevo más tarde."
}
