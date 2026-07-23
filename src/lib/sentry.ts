import * as Sentry from "@sentry/nextjs"
import { logger } from "@/lib/logger"

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    logger.error("[DEV Error]", error, context || "")
    return
  }
  Sentry.captureException(error, {
    extra: context,
  })
}

export function captureMessage(message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") return
  Sentry.captureMessage(message, {
    level: "info",
    extra: context,
  })
}

export function setSentryUser(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser(user)
}

export function clearSentryUser() {
  Sentry.setUser(null)
}
