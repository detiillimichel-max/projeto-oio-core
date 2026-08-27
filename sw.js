const CACHE_NAME = 'oio-one-v6';
const STATIC_ASSETS = [
  'teste.html',
  'manifest.json',
  'icone-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  // Never cache the chat API. Messages must always reach Vercel/Turso.
  if (new URL(request.url).pathname.startsWith('/api/')) return;

  // HTML/navigation: network first, so Vercel always gets the newest version.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('teste.html')))
    );
    return;
  }

  // Other static resources can use the versioned cache.
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
