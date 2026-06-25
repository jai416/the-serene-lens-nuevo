export function initSentry() {
  // Sentry removed — DSN was invalid (403 Forbidden)
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error("[Error]", error, context || "")
}
