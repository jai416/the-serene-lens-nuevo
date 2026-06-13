import { getEnv } from "@/lib/env"

const env = getEnv()

interface CreateQvaPayOptions {
  amount: number
  description: string
  plan: string
  userId: string
}

export async function createQvaPayPayment({ amount, description, plan, userId }: CreateQvaPayOptions) {
  const res = await fetch(`${env.QVAPAY_API_URL}/create_payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uuid: env.QVAPAY_UUID,
      secret: env.QVAPAY_SECRET,
      amount,
      description,
      remote_id: `${userId}_${plan}_${Date.now()}`,
      webhook: `${env.NEXTAUTH_URL}/api/payments/webhook`,
      redirect_url: `${env.NEXTAUTH_URL}/dashboard/subscription?payment=success`,
      cancel_url: `${env.NEXTAUTH_URL}/pricing?payment=cancelled`,
    }),
  })

  if (!res.ok) throw new Error("Error al crear pago en QvaPay")

  return res.json()
}

export async function createQvaPayPackPayment({ amount, description, packType, userId }: CreateQvaPayOptions & { packType: string }) {
  const res = await fetch(`${env.QVAPAY_API_URL}/create_payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uuid: env.QVAPAY_UUID,
      secret: env.QVAPAY_SECRET,
      amount,
      description,
      remote_id: `${userId}_pack_${packType}_${Date.now()}`,
      webhook: `${env.NEXTAUTH_URL}/api/payments/webhook`,
      redirect_url: `${env.NEXTAUTH_URL}/dashboard/subscription?payment=success`,
      cancel_url: `${env.NEXTAUTH_URL}/pricing?payment=cancelled`,
    }),
  })

  if (!res.ok) throw new Error("Error al crear pago en QvaPay")

  return res.json()
}

export async function getQvaPayPaymentStatus(qvapayId: string) {
  const res = await fetch(`${env.QVAPAY_API_URL}/get_payment_info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uuid: env.QVAPAY_UUID,
      secret: env.QVAPAY_SECRET,
      payment_id: qvapayId,
    }),
  })

  if (!res.ok) throw new Error("Error al verificar pago")

  return res.json()
}

export function getPaymentError(provider: string, error: unknown): string {
  if (provider === "stripe") {
    return "No pudimos procesar el pago con tarjeta. Intenta con criptomonedas."
  }
  return "No pudimos procesar el pago. Intenta de nuevo más tarde."
}
