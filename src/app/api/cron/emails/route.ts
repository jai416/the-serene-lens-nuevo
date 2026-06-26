import { processEmailSequences } from "@/lib/services/email-processor"
import { verifyCronSecret } from "@/lib/cron-auth"
import { ok, error, serverError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return error("Unauthorized", 401)
    }

    const result = await processEmailSequences()
    return ok({ message: "Emails processed", ...result })
  } catch {
    return serverError()
  }
}

export async function GET() {
  return ok({ message: "Email sequence endpoint. Use POST to process." })
}
