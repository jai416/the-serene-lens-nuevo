export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (typeof window !== "undefined" && dsn) {
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      })
    }).catch(() => {})
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error, { extra: context })
    }).catch(() => {
      console.error("Error:", error, context || "")
    })
  } else {
    console.error("Error:", error, context || "")
  }
}
