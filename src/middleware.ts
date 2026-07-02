import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateCorrelationId, setCorrelationId } from "@/lib/logger"
import { getToken } from "next-auth/jwt"

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://cdn-icons-png.flaticon.com https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://api.openrouter.ai https://api.qvapay.com https://www.qvapay.com https://*.supabase.co https://app.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://o4511315853246464.ingest.us.sentry.io https://api.telegram.org",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

export async function middleware(request: NextRequest) {
  const start = performance.now()
  const correlationId = request.headers.get("x-correlation-id") || generateCorrelationId()
  setCorrelationId(correlationId)

  const response = NextResponse.next()
  response.headers.set("x-correlation-id", correlationId)

  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("x-response-time", `${(performance.now() - start).toFixed(0)}ms`)
  }

  if (!request.cookies.get("csrf-token")) {
    const token = crypto.randomUUID().replace(/-/g, "")
    response.cookies.set("csrf-token", token, {
      path: "/",
      sameSite: "strict",
      maxAge: 3600,
      secure: process.env.NODE_ENV === "production",
    })
  }

  const existingCsp = response.headers.get("content-security-policy")
  if (!existingCsp) {
    response.headers.set("Content-Security-Policy", CSP_DIRECTIVES)
  }

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/api/admin")) {
    const token = await getToken({ req: request })
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|fonts|css|js).*)"],
}
