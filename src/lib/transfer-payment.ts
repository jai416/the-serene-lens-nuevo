import { db } from "@/lib/db"
import crypto from "crypto"

export async function generateReferenceCode(): Promise<string> {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, "")
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `TRF-${date}-${suffix}`
}

export function getTransferConfig() {
  return {
    account: process.env.TRANSFER_ACCOUNT || "",
    holder: process.env.TRANSFER_HOLDER || "",
  }
}
