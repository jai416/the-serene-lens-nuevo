import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>
      delete headers.cookie
      delete headers.authorization
    }
    return event
  },
})
