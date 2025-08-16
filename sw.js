/* Mummy Mirror Service Worker */
const CACHE_NAME = 'mummy-mirror-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: cache core assets for full offline
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch: Cache-first for same-origin; network fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // Cache-first for same-origin files
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((res) => {
            // Optionally cache new GET responses
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            return res;
          })
        );
      })
    );
  }
  // For cross-origin requests, just try network and fall back to cache if present
  else {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});
