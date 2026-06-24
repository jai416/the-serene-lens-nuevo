import crypto from "crypto"

const TOKEN_LENGTH = 32
const TOKEN_EXPIRY = 60 * 60 * 1000

export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex")
}

export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false
  if (token.length !== TOKEN_LENGTH * 2) return false
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken))
}

export function getCsrfTokenFromRequest(req: Request): string | null {
  const csrfHeader = req.headers.get("x-csrf-token")
  if (csrfHeader) return csrfHeader
  return null
}

export const CSRF_COOKIE_NAME = "csrf-token"
export const CSRF_HEADER_NAME = "x-csrf-token"

export function setCsrfCookie(response: Response, token: string): void {
  response.headers.append(
    "Set-Cookie",
    `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Max-Age=${TOKEN_EXPIRY / 1000}; ${process.env.NODE_ENV === "production" ? "Secure; " : ""}HttpOnly=false`
  )
}
