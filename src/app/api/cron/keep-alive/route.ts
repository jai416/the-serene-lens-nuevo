import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Keep-alive ping received",
  })
}
