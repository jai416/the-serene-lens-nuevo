/**
 * IP real del cliente para rate limiting.
 *
 * Detrás de Cloudflare/Render, `x-forwarded-for` contiene varias IPs
 * (cliente, edge de Cloudflare, internas) y las del medio CAMBIAN en cada
 * request. Usar la cadena completa como key de rate limit hace que cada
 * request genere una key distinta → el límite nunca bloquea.
 *
 * La primera posición es la IP original del cliente (convención XFF).
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown"
}
