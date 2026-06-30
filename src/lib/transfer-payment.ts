import { db } from "@/lib/db"

export async function generateReferenceCode(): Promise<string> {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, "")
  const count = await db.transferPayment.count({
    where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
  })
  return `TRF-${date}-${String(count + 1).padStart(3, "0")}`
}

export function getTransferConfig() {
  return {
    account: process.env.TRANSFER_ACCOUNT || "9238000000000000",
    holder: process.env.TRANSFER_HOLDER || "Nombre del Titular",
  }
}
