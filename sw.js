// Waylo offline worker. The page is network-first (so updates arrive), everything else is cache-first.
// Heavy assets (skies, sounds, textures, models, fonts) live in a cache that survives app updates, so an update never re-downloads them.
const VERSION = 'waylo-mumwtteb', ASSETS = 'waylo-assets-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== ASSETS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const FONT = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return; const url = new URL(req.url), same = url.origin === location.origin;
  if (!same && !FONT.test(req.url)) return;
  const isPage = same && (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/'));
  if (isPage) { e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('index.html', cp)); return r; }).catch(() => caches.match('index.html'))); return; }
  const store = same && /\.(js|webmanifest)$/.test(url.pathname) ? VERSION : ASSETS;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(store).then(c => c.put(req, cp)); } return r; })));
});
// tapping a notification brings the app back
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./'))); });
