import crypto from "crypto"

export function verifyCronSecret(req: Request): boolean {
  const authHeader = req.headers.get("authorization")
  const cronSecret = req.headers.get("x-cron-secret")
  const expected = process.env.CRON_SECRET

  if (!expected) return false

  if (authHeader) {
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader
    if (timingSafeEqual(token, expected)) return true
  }

  if (cronSecret && timingSafeEqual(cronSecret, expected)) return true

  return false
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length))
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}
