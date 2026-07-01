import { NextRequest } from "next/server"
import { getCsrfTokenFromRequest, validateCsrfToken, CSRF_COOKIE_NAME } from "@/lib/csrf"

export function validateCsrf(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return true

  const token = getCsrfTokenFromRequest(request)
  if (!token) return false

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (!cookieToken) return false

  return validateCsrfToken(token, cookieToken)
}
