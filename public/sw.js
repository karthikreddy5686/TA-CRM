// Flux TA CRM Progressive Web App Service Worker
// Designed for reliable cold-starts, zero white-screens, and offline resilience
const CACHE_NAME = 'flux-ta-crm-v3';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/flux-icon.png',
  '/favicon.svg'
];

// 1. Install Event: Cache essential app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching some assets skipped:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up stale legacy caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Message Listener: Support instant update skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch Event: Dual-Strategy to prevent White Screen on cold-start & refresh
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests with http/https schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // A. Backend API calls: Always Network-First / Network-Only (never stale database/auth)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // B. Navigation / HTML Document requests (e.g., initial page load, refreshing tab, opening from recents)
  // STRATEGY: Network-First with quick timeout -> Fallback to cached index.html
  // This guarantees that if the app was updated on server, users immediately get the new index.html with new JS bundle hashes!
  const isNavigation = request.mode === 'navigate' || request.destination === 'document';
  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          // Attempt network fetch with a 2.5s timeout for mobile wake-up
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const networkResponse = await fetch(request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/index.html', networkResponse.clone());
            cache.put('/', networkResponse.clone());
            return networkResponse;
          }
        } catch (fetchErr) {
          // Network failed or timed out (offline / mobile cold start)
        }

        // Fallback to cached index.html
        const cachedDoc = (await caches.match('/index.html')) || (await caches.match('/'));
        if (cachedDoc) {
          return cachedDoc;
        }

        // If completely empty, try network without abort signal as last resort
        return fetch(request);
      })()
    );
    return;
  }

  // C. Static Assets: JS bundles (/assets/*.js), CSS, Fonts, Images
  // STRATEGY: Cache-First with Network Fallback + Automatic Runtime Caching
  // This ensures once a JS chunk is downloaded, it's stored locally and NEVER fails on cold start!
  const isStaticAsset = 
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.webmanifest');

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        // 1. Check cache first
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        // 2. Not in cache: Fetch from network and store in cache
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (netErr) {
          // If offline and request is an asset that wasn't cached, try fallback
          console.warn('[SW] Asset fetch failed:', request.url);
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        }
      })()
    );
    return;
  }

  // D. Other requests: Stale-While-Revalidate default
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
