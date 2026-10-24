const CACHE_NAME = 'khudarna-pwa-v3';
const APP_SHELL = [
  'index.html', 'login.html', 'login.js', 'admin.html', 'courier.html', 'styles.css', 'fx.js',
  'config.js', 'app.js', 'admin.js', 'courier.js', 'pwa.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  // Never intercept non-GET, cross-origin, Supabase, auth, storage or edge-function requests.
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/rest/') || url.pathname.startsWith('/functions/')) return;
  // Network-first: يظهر أحدث تصميم دائماً، ويعمل من الذاكرة عند انقطاع الإنترنت.
  event.respondWith(fetch(req).then(response => {
    if (response && response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(req, copy)); }
    return response;
  }).catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? await caches.match('index.html') : Response.error())));
});
