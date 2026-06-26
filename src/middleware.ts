import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateCorrelationId, setCorrelationId } from "@/lib/logger"

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://cdn-icons-png.flaticon.com https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://api.openrouter.ai https://api.qvapay.com https://www.qvapay.com https://*.supabase.co https://app.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://o4511315853246464.ingest.us.sentry.io",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

export function middleware(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || generateCorrelationId()
  setCorrelationId(correlationId)

  const response = NextResponse.next()
  response.headers.set("x-correlation-id", correlationId)

  const existingCsp = response.headers.get("content-security-policy")
  if (!existingCsp) {
    response.headers.set("Content-Security-Policy", CSP_DIRECTIVES)
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const start = Date.now()
    response.headers.set("x-response-time", `${Date.now() - start}ms`)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|fonts|css|js).*)"],
}
