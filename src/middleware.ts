import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateCorrelationId, setCorrelationId } from "@/lib/logger"

export function middleware(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || generateCorrelationId()
  setCorrelationId(correlationId)

  const response = NextResponse.next()
  response.headers.set("x-correlation-id", correlationId)

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const start = Date.now()
    response.headers.set("x-response-time", `${Date.now() - start}ms`)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|fonts|css|js).*)"],
}
