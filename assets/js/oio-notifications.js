(() => {
  'use strict';

  const API = '/api/push';
  const SW_URL = '/sw.js';
  const STORAGE_KEY = 'oio_unread_count';
  let observerReady = false;
  let notificationSetupStarted = false;

  function base64ToUint8Array(base64) {
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
  }

  function getUnread() {
    return Math.max(Number(localStorage.getItem(STORAGE_KEY)) || 0, 0);
  }

  function setUnread(value) {
    const count = Math.max(Number(value) || 0, 0);
    localStorage.setItem(STORAGE_KEY, String(count));
    if ('setAppBadge' in navigator) {
      const result = count ? navigator.setAppBadge(count) : navigator.clearAppBadge?.();
      if (result?.catch) result.catch(() => {});
    }
  }

  function clearUnread() {
    setUnread(0);
  }

  async function registerWorker() {
    if (!('serviceWorker' in navigator)) return null;
    return navigator.serviceWorker.register(SW_URL, { scope: './' });
  }

  async function subscribePush() {
    if (!('PushManager' in window) || !('Notification' in window)) return;
    const registration = await registerWorker();
    if (!registration) return;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    if (Notification.permission !== 'granted') return;

    const keyResponse = await fetch(API, { cache: 'no-store' });
    const keyData = await keyResponse.json();
    if (!keyResponse.ok || !keyData.publicKey) throw new Error(keyData.error || 'Chave Push indisponível.');

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(keyData.publicKey)
      });
    }

    const autor = localStorage.getItem('oio_nome') || 'Usuário';
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor, subscription: subscription.toJSON() })
    });
  }

  function iniciarContador() {
    const area = document.getElementById('area-principal');
    if (!area || observerReady) return;
    observerReady = true;

    let inicializado = false;
    const observer = new MutationObserver(mutations => {
      if (!inicializado) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.classList.contains('balao')) continue;
          if (node.classList.contains('minha')) continue;
          setUnread(getUnread() + 1);
        }
      }
    });
    observer.observe(area, { childList: true });
    setTimeout(() => { inicializado = true; }, 2500);
  }

  function limparAoAbrir() {
    const limpar = () => clearUnread();
    window.addEventListener('focus', limpar);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') limpar();
    });
  }

  function iniciar() {
    iniciarContador();
    limparAoAbrir();
    registerWorker().catch(error => console.warn('OIO Service Worker:', error));

    const preparar = () => {
      if (notificationSetupStarted) return;
      notificationSetupStarted = true;
      subscribePush().catch(error => console.warn('OIO Push:', error));
    };
    window.addEventListener('pointerdown', preparar, { once: true, passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
