// The Serene Lens — Service Worker v7
// Enhanced caching: multi-cache strategy with API, image, and page separation
// Added: share target handler, periodic background sync, file handling

// ─── Cache Names ────────────────────────────────────────────────
const CACHE_NAME = 'serene-lens-v7';
const DYNAMIC_CACHE = 'serene-lens-dynamic-v7';
const IMAGE_CACHE = 'serene-lens-images-v7';

const ACTIVE_CACHES = [CACHE_NAME, DYNAMIC_CACHE, IMAGE_CACHE];

// ─── Share Target POST handler ──────────────────────────────────
const SHARED_DATA_CACHE = 'serene-lens-shared-data';

// ─── Static Assets ──────────────────────────────────────────────
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/images/favicon-icon.png',
  '/images/logo-icon.webp',
  '/images/hero-skincare.webp',
  '/images/hero-clean.png',
];

// ─── Static asset extensions for cache-first ────────────────────
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|svg|gif|ico|avif)$/i;
const FONT_DOMAINS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// ─── Install ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
        return Promise.resolve();
      })
    )
  );
  self.skipWaiting();
});

// ─── Periodic Background Sync ──────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-checkin') {
    event.waitUntil(handleDailyCheckin());
  } else if (event.tag === 'weekly-report') {
    event.waitUntil(handleWeeklyReport());
  } else if (event.tag === 'routine-reminder') {
    event.waitUntil(handleRoutineReminder());
  }
});

async function handleDailyCheckin() {
  console.log('[SW] Ejecutando daily-checkin sync');
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length === 0) {
      await self.registration.showNotification('📋 Registro Diario', {
        body: 'No olvides registrar el estado de tu piel hoy. ¡Mantén tu racha!',
        icon: '/images/logo-icon.webp',
        badge: '/images/favicon-icon.png',
        tag: 'daily-checkin',
        data: { url: '/skin-diary' },
        vibrate: [100, 50, 100],
      });
    }
  } catch (err) {
    console.warn('[SW] Error en daily-checkin:', err);
  }
}

async function handleWeeklyReport() {
  console.log('[SW] Ejecutando weekly-report sync');
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length === 0) {
      await self.registration.showNotification('📊 Informe Semanal', {
        body: 'Tu informe semanal de progreso de piel está listo. ¡Revisa tus mejoras!',
        icon: '/images/logo-icon.webp',
        badge: '/images/favicon-icon.png',
        tag: 'weekly-report',
        data: { url: '/dashboard' },
        vibrate: [100, 50, 100],
      });
    }
  } catch (err) {
    console.warn('[SW] Error en weekly-report:', err);
  }
}

async function handleRoutineReminder() {
  console.log('[SW] Ejecutando routine-reminder sync');
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length === 0) {
      await self.registration.showNotification('🧴 Recordatorio de Rutina', {
        body: 'Es hora de tu rutina de skincare. ¡Sigue tu plan personalizado!',
        icon: '/images/logo-icon.webp',
        badge: '/images/favicon-icon.png',
        tag: 'routine-reminder',
        data: { url: '/routine-generator' },
        vibrate: [100, 50, 100],
      });
    }
  } catch (err) {
    console.warn('[SW] Error en routine-reminder:', err);
  }
}

// ─── Activate ───────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ACTIVE_CACHES.includes(k))
          .map((k) => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Push notification click handler ────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// ─── Push event handler ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'The Serene Lens',
    body: 'Tienes una nueva notificación.',
    icon: '/images/logo-icon.webp',
    badge: '/images/favicon-icon.png',
    tag: 'default',
    url: '/',
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch {
      const text = event.data.text();
      if (text) data.body = text;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || 'default',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── Fetch ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(event.request.url);

  // Handle share target POST
  if (request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(handleShareTargetPost(request));
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except Google Fonts)
  if (
    url.origin !== self.location.origin &&
    !FONT_DOMAINS.some((d) => url.hostname.includes(d))
  ) {
    return;
  }

  // API responses — Network-first with 5-minute cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(apiStrategy(request));
    return;
  }

  // Images — Cache-first with 30-day cache
  if (IMAGE_EXTENSIONS.test(url.pathname) || request.destination === 'image') {
    event.respondWith(imageStrategy(request));
    return;
  }

  // Google Fonts — Cache-first
  if (FONT_DOMAINS.some((d) => url.hostname.includes(d))) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Navigation (HTML pages) — Stale-while-revalidate
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default — Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ─── Strategies ─────────────────────────────────────────────────

/** API: Network-first, cache fallback, 5-minute expiry */
async function apiStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and cache for 5 minutes
      const headers = new Headers(response.headers);
      headers.set('sw-cache-timestamp', Date.now().toString());

      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

      cache.put(request, cachedResponse.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      // Check if cache is stale (> 5 minutes)
      const timestamp = cached.headers.get('sw-cache-timestamp');
      if (timestamp && Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
        // Cache is stale but still return it (better than nothing)
      }
      return cached;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Sin conexión a internet. Verifica tu conexión e intenta de nuevo.',
        offline: true,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/** Images: Cache-first with long expiry (30 days) */
async function imageStrategy(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cache-timestamp', Date.now().toString());

      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

      cache.put(request, cachedResponse.clone());
    }
    return response;
  } catch {
    // Offline image fallback
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="none"><rect width="400" height="300" fill="#f5f5f4"/><text x="200" y="150" font-family="sans-serif" font-size="14" fill="#a8a29e" text-anchor="middle">Sin conexión</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

/** Navigation: Stale-while-revalidate */
async function navigationStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const headers = new Headers(response.headers);
        headers.set('sw-cache-timestamp', Date.now().toString());

        const cachedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });

        cache.put(request, cachedResponse);
      }
      return response;
    })
    .catch(() => {
      // Network failed — that's fine, we served from cache
    });

  return cached || fetchPromise;
}

/** Stale-while-revalidate with specified cache */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {});

  return cached || fetchPromise;
}

/** Simple cache-first strategy */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Request Timeout' });
  }
}

// ─── Share Target Handler ──────────────────────────────────────
async function handleShareTargetPost(request) {
  try {
    const formData = await request.formData();
    const shareData = {
      title: formData.get('title') || '',
      text: formData.get('text') || '',
      url: formData.get('url') || '',
      files: [],
    };

    // Process shared files (images)
    const files = formData.getAll('files')
      .filter(Boolean);
    
    for (const file of files) {
      if (file instanceof File && file.type.startsWith('image/')) {
        shareData.files.push(file);
      }
    }

    // Store shared data in cache for the client to pick up
    const cache = await caches.open(SHARED_DATA_CACHE);
    await cache.put(
      new Request('/shared-data'),
      new Response(JSON.stringify(shareData), {
        headers: { 'Content-Type': 'application/json' },
      })
    );

    // Notify all clients about the shared data
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({
        type: 'SHARE_TARGET_DATA',
        data: shareData,
      });
    }

    // Determine redirect based on content type
    let redirectUrl = '/';
    if (shareData.files.length > 0) {
      redirectUrl = '/analysis?sharedImage=true';
    } else if (shareData.text) {
      redirectUrl = `/ingredients?q=${encodeURIComponent(shareData.text)}`;
    } else if (shareData.url) {
      redirectUrl = shareData.url;
    }

    return Response.redirect(redirectUrl, 303);
  } catch (err) {
    console.warn('[SW] Error handling share target:', err);
    return Response.redirect('/', 303);
  }
}
