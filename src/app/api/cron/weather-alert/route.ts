import { ok, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { verifyCronSecret } from "@/lib/cron-auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return error("Unauthorized", 401)
    }

    logger.info("Weather UV alert cron ran - feature pending integration")

    return ok({
      success: true,
      message: "Weather UV alert cron ran - feature pending integration",
    })
  } catch (e) {
    logger.error("Weather alert cron failed:", { error: e })
    return error("Internal server error", 500)
  }
}
