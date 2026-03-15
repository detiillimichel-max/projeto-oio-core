const CACHE_NAME = 'oio-v5-cache-v1';
const assets = [
  'teste.html',
  'videos.html',
  'games.html',
  'icone-512.png',
  'manifest.json',
  'style.css'
];

// 1. Instala e guarda os arquivos na memória do celular
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. Faz o app abrir rápido mesmo com internet ruim
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Retorna do cache se existir, se não, busca na internet
      return response || fetch(event.request);
    })
  );
});

// 3. Limpa memórias antigas quando você atualizar o app
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});
