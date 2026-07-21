import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "set (length: " + process.env.GEMINI_API_KEY.length + ")" : "NOT SET",
    GROQ_API_KEY: process.env.GROQ_API_KEY ? "set (length: " + process.env.GROQ_API_KEY.length + ")" : "NOT SET",
    CRON_SECRET: process.env.CRON_SECRET ? "set" : "NOT SET",
  })
}
