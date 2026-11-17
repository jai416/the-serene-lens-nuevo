import { NextResponse } from "next/server"
import { verifyCronSecret } from "@/lib/cron-auth"

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "set (length: " + process.env.GEMINI_API_KEY.length + ")" : "NOT SET",
    GROQ_API_KEY: process.env.GROQ_API_KEY ? "set (length: " + process.env.GROQ_API_KEY.length + ")" : "NOT SET",
    CRON_SECRET: process.env.CRON_SECRET ? "set" : "NOT SET",
  })
}
