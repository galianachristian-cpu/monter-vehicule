/* Montée en véhicule : service worker pour l'installation et l'usage hors ligne */
const CACHE = 'monter-vehicule-v1';
const CORE = ['./', './index.html', './fat.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  // les données GitHub passent toujours directement au réseau
  if (url.hostname === 'api.github.com') return;
  // page : réseau d'abord (toujours la dernière version), sinon la copie gardée
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  // polices, lecture des chiffres, QR code : copie gardée d'abord (versions figées)
  if (/fonts\.(googleapis|gstatic)\.com$|cdn\.jsdelivr\.net$|tessdata\.projectnaptha\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })));
    return;
  }
  // fichiers de l'appli : copie gardée, mise à jour en arrière-plan
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; }).catch(() => hit); return hit || net; }));
  }
});
