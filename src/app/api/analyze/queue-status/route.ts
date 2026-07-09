import { NextRequest } from "next/server"
import { ok, error } from "@/lib/api-response"
import { analysisQueue } from "@/lib/queue"

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId")
  if (!jobId) return error("jobId requerido")

  const status = await analysisQueue.getStatus(jobId)
  if (status.status === "NOT_FOUND") return error("Job no encontrado", 404)

  return ok(status)
}
