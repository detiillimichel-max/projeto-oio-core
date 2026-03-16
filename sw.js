const CACHE_NAME = 'oio-one-v5';
const assets = [
  'index.html',
  'vibe_connect.html',
  'vibe_hub.html',
  'games.html',
  'teste.html',
  'vibe.html',
  'portal.html',
  'vibe_som.html',
  'manifest.json',
  'icone-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
