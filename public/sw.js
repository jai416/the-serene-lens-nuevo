const CACHE_NAME = "serene-lens-v1"

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.webp",
  "/favicon.ico",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request))
    return
  }

  event.respondWith(cacheFirst(request))
})

async function networkFirst(request: Request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response("Offline", { status: 503 })
  }
}

async function cacheFirst(request: Request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    return await fetch(request)
  } catch {
    return new Response("Offline", { status: 503 })
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
})
