import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateReferenceCode, getTransferConfig } from "@/lib/transfer-payment"
import { ok, error, unauthorized } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const { plan, amount } = await req.json()
  if (!plan || !amount) return error("Faltan datos")

  const config = getTransferConfig()
  const referenceCode = await generateReferenceCode()

  const transfer = await db.transferPayment.create({
    data: {
      userId: session.user.id,
      plan,
      amount,
      referenceCode,
      transferAccount: config.account,
      transferHolder: config.holder,
      status: "pending",
    },
  })

  return ok({
    referenceCode: transfer.referenceCode,
    account: config.account,
    holder: config.holder,
    amount: transfer.amount,
    plan: transfer.plan,
    id: transfer.id,
  })
}
