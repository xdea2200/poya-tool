// 寶雅銷售分析 – offline cache. Bump VERSION when files change.
const VERSION = 'poya-sales-v2';
const ASSETS = ['./', './index.html', './xlsx.full.min.js', './manifest.webmanifest', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('poya-sales-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // 子資料夾 search/ 是另一個工具，交給它自己的 service worker
  if (new URL(req.url).pathname.startsWith(new URL('./search/', self.registration.scope).pathname)) return;
  if (req.mode === 'navigate') {
    // newest page when online, cached page when offline
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
    return res;
  })));
});
