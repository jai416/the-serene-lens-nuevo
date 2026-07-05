import { ok, error } from "@/lib/api-response"

export const runtime = "edge"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return error("Unauthorized", 401)
  }

  return ok({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Keep-alive ping received",
  })
}
