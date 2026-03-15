const CACHE_NAME = 'oio-v5-cache-v1';
const assets = ['teste.html', 'videos.html', 'games.html', 'icone-512.png', 'manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
});
