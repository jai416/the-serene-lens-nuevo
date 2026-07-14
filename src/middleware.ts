import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateCorrelationId, setCorrelationId } from "@/lib/logger"
import { getToken } from "next-auth/jwt"

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://cdn-icons-png.flaticon.com https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://api.qvapay.com https://www.qvapay.com https://*.supabase.co https://api.groq.com https://app.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://o4511315853246464.ingest.us.sentry.io https://api.telegram.org",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
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
    const buf = new Uint8Array(32)
    crypto.getRandomValues(buf)
    const token = Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("")
    response.cookies.set("csrf-token", token, {
      path: "/",
      sameSite: "strict",
      maxAge: 3600,
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    })
  }

  if (["POST", "PATCH", "DELETE"].includes(request.method) &&
      request.nextUrl.pathname.startsWith("/api/") &&
      !request.nextUrl.pathname.startsWith("/api/auth") &&
      !request.nextUrl.pathname.startsWith("/api/register") &&
      !request.nextUrl.pathname.startsWith("/api/telegram/webhook") &&
      !request.nextUrl.pathname.startsWith("/api/cron") &&
      !request.nextUrl.pathname.startsWith("/api/chat") &&
      !request.nextUrl.pathname.startsWith("/api/contact")) {
    if (!request.headers.get("x-csrf-skip")) {
      const headerToken = request.headers.get("x-csrf-token")
      const cookieToken = request.cookies.get("csrf-token")?.value
      if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        return NextResponse.json(
          { success: false, error: "CSRF token inválido" },
          { status: 403 }
        )
      }
    }
  }

  const existingCsp = response.headers.get("content-security-policy")
  if (!existingCsp) {
    response.headers.set("Content-Security-Policy", CSP_DIRECTIVES)
  }

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  if ((request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/api/admin")) &&
      !request.nextUrl.pathname.startsWith("/api/cron")) {
    const token = await getToken({ req: request, cookieName: "next-auth.session-token" })
    if (!token || token.role !== "ADMIN") {
      if (request.nextUrl.pathname.startsWith("/api/admin")) {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|fonts|css|js|guides|images).*)"],
}
