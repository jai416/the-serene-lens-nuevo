const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"

let posthog: any = null

async function getPosthog() {
  if (posthog !== null) return posthog
  if (typeof window === "undefined" || !POSTHOG_KEY) {
    posthog = null
    return null
  }
  try {
    const mod = await import("posthog-js")
    posthog = mod.default || mod
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      persistence: "localStorage",
      loaded: (ph: any) => {
        if (process.env.NODE_ENV !== "production") ph.opt_out_capturing()
      },
    })
  } catch {
    posthog = null
  }
  return posthog
}

export function initAnalytics() {
  if (typeof window !== "undefined") {
    getPosthog()
  }
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  getPosthog().then((ph) => {
    if (ph) {
      try { ph.capture(name, properties) } catch {}
    }
  }).catch(() => {})
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  getPosthog().then((ph) => {
    if (ph) {
      try { ph.identify(userId, traits) } catch {}
    }
  }).catch(() => {})
}
