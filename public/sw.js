const CACHE_NAME = "serene-lens-v2"
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => Promise.resolve())
    )
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET") return
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request))
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request))
  } else {
    event.respondWith(staleWhileRevalidate(request))
  }
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response("Offline", { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: "Offline" }), {
      headers: { "Content-Type": "application/json" },
    })
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(CACHE_NAME)
        cache.then((c) => c.put(request, response.clone()))
      }
      return response
    })
    .catch(() => cached)

  return cached || fetchPromise
}
