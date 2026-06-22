import { NextResponse } from "next/server"
import { processEmailSequences } from "@/lib/services/email-processor"
import { verifyCronSecret } from "@/lib/cron-auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await processEmailSequences()
    return NextResponse.json({ message: "Emails processed", ...result })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process emails" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Email sequence endpoint. Use POST to process." })
}
