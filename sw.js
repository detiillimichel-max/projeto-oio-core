const CACHE_NAME = 'oio-one-v7';
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
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).pathname.startsWith('/api/')) return;

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

  event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'OIO';
  const body = data.body || 'Você recebeu uma nova mensagem.';
  const messageId = data.messageId || '';
  const url = data.url || 'teste.html';

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: 'icone-512.png',
    badge: 'icone-512.png',
    tag: messageId ? `oio-message-${messageId}` : 'oio-message',
    renotify: true,
    data: { url, messageId },
    actions: [
      { action: 'reply', title: 'Responder' },
      { action: 'read', title: 'Marcar como lida' }
    ]
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || 'teste.html', self.location.origin);
  if (event.action === 'reply') target.searchParams.set('responder', '1');
  if (event.action === 'read') target.searchParams.set('marcar', '1');

  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const sameOrigin = clients.find(client => new URL(client.url).origin === self.location.origin);
    if (sameOrigin && 'focus' in sameOrigin) return sameOrigin.focus().then(() => sameOrigin.navigate(target.href));
    if (self.clients.openWindow) return self.clients.openWindow(target.href);
  }));
});
