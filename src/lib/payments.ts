import { getEnv } from "@/lib/env"

function getPaymentsEnv() {
  return getEnv()
}

interface CreateQvaPayOptions {
  amount: number
  description: string
  plan: string
  userId: string
}

export async function createQvaPayPayment({ amount, description, plan, userId }: CreateQvaPayOptions) {
  const e = getPaymentsEnv()
  const res = await fetch(`${e.QVAPAY_API_URL}/v2/create_invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "app-id": e.QVAPAY_UUID,
      "app-secret": e.QVAPAY_SECRET,
    },
    body: JSON.stringify({
      amount,
      description,
      remote_id: `${userId}_${plan}_${Date.now()}`,
      webhook: `${e.NEXTAUTH_URL}/api/payments/webhook`,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error("[QvaPay] create_payment failed:", res.status, body)
    throw new Error("Error al crear pago en QvaPay")
  }

  return res.json()
}

export async function createQvaPayPackPayment({ amount, description, packType, userId }: CreateQvaPayOptions & { packType: string }) {
  const e = getPaymentsEnv()
  const res = await fetch(`${e.QVAPAY_API_URL}/v2/create_invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "app-id": e.QVAPAY_UUID,
      "app-secret": e.QVAPAY_SECRET,
    },
    body: JSON.stringify({
      amount,
      description,
      remote_id: `${userId}_pack_${packType}_${Date.now()}`,
      webhook: `${e.NEXTAUTH_URL}/api/payments/webhook`,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error("[QvaPay] create_pack_payment failed:", res.status, body)
    throw new Error("Error al crear pago en QvaPay")
  }

  return res.json()
}

export async function getQvaPayPaymentStatus(transactionUuid: string) {
  const e = getPaymentsEnv()
  const res = await fetch(`${e.QVAPAY_API_URL}/v2/transaction/${transactionUuid}`, {
    method: "GET",
    headers: {
      "app-id": e.QVAPAY_UUID,
      "app-secret": e.QVAPAY_SECRET,
    },
  })

  if (!res.ok) throw new Error("Error al verificar pago")

  return res.json()
}

export function getPaymentError(provider: string, error: unknown): string {
  return "No pudimos procesar el pago. Intenta de nuevo más tarde."
}
