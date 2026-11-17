const CSRF_COOKIE = "csrf-token"

export function getCsrfToken(): string {
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ""
}

/**
 * fetch con el token CSRF inyectado automáticamente.
 *
 * IMPORTANTE: los endpoints de mutación validan `x-csrf-token` contra la
 * cookie `csrf-token`. En desarrollo la validación se salta (NODE_ENV), así
 * que olvidar la cabecera SOLO se detecta en producción (403 silencioso).
 * Usa siempre este wrapper para POST/PUT/PATCH/DELETE.
 */
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase()
  const headers = new Headers(init.headers)

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const token = getCsrfToken()
    if (token) headers.set("x-csrf-token", token)
    if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
      headers.set("Content-Type", "application/json")
    }
  }

  return fetch(input, { ...init, headers, credentials: init.credentials ?? "same-origin" })
}
