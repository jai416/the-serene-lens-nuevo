function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env variable: ${key}`)
  return value
}

function optionalEnv(key: string, fallback: string = ""): string {
  return process.env[key] || fallback
}

export function getEnv() {
  return {
    DATABASE_URL: requireEnv("DATABASE_URL"),
    NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET"),
    NEXTAUTH_URL: optionalEnv("NEXTAUTH_URL", "http://localhost:3000"),
    GOOGLE_CLIENT_ID: optionalEnv("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: optionalEnv("GOOGLE_CLIENT_SECRET"),
    GITHUB_CLIENT_ID: optionalEnv("GITHUB_CLIENT_ID"),
    GITHUB_CLIENT_SECRET: optionalEnv("GITHUB_CLIENT_SECRET"),
    OPENROUTER_API_KEY: requireEnv("OPENROUTER_API_KEY"),
    QVAPAY_UUID: requireEnv("QVAPAY_UUID"),
    QVAPAY_SECRET: requireEnv("QVAPAY_SECRET"),
    QVAPAY_URL: optionalEnv("QVAPAY_URL", "https://qvapay.com"),
    QVAPAY_API_URL: optionalEnv("QVAPAY_API_URL", "https://qvapay.com/api/v1"),
    QVAPAY_TAX_RATE: optionalEnv("QVAPAY_TAX_RATE", "0"),
    ROOT_ADMIN_EMAIL: optionalEnv("ROOT_ADMIN_EMAIL"),
    EXCHANGERATE_API_KEY: optionalEnv("EXCHANGERATE_API_KEY"),
    NEXT_PUBLIC_WHATSAPP_NUMBER: optionalEnv("NEXT_PUBLIC_WHATSAPP_NUMBER"),
    STRIPE_SECRET_KEY: optionalEnv("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: optionalEnv("STRIPE_WEBHOOK_SECRET"),
    STRIPE_PREMIUM_PRICE_ID: optionalEnv("STRIPE_PREMIUM_PRICE_ID"),
    STRIPE_PRO_PRICE_ID: optionalEnv("STRIPE_PRO_PRICE_ID"),
    STRIPE_BASIC_PACK_PRICE_ID: optionalEnv("STRIPE_BASIC_PACK_PRICE_ID"),
    STRIPE_POPULAR_PACK_PRICE_ID: optionalEnv("STRIPE_POPULAR_PACK_PRICE_ID"),
    STRIPE_ADVANCED_PACK_PRICE_ID: optionalEnv("STRIPE_ADVANCED_PACK_PRICE_ID"),
  }
}
