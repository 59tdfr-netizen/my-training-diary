const CACHE = 'training-diary-v6';
const ASSETS = ['./', './index.html', './catalog.js', './ai.js', './photos.js', './nutrition.js', './trainer.js', './features.js', './app.js', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // РќР°РІРёРіР°С†РёСЏ: СЃРЅР°С‡Р°Р»Р° СЃРµС‚СЊ (С‡С‚РѕР±С‹ РѕР±РЅРѕРІР»РµРЅРёСЏ РїРѕРґС…РІР°С‚С‹РІР°Р»РёСЃСЊ), РѕС„Р»Р°Р№РЅ вЂ” РёР· РєСЌС€Р°.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // РћСЃС‚Р°Р»СЊРЅС‹Рµ GET-Р·Р°РїСЂРѕСЃС‹: РєСЌС€, Р·Р°С‚РµРј СЃРµС‚СЊ СЃ СЃРѕС…СЂР°РЅРµРЅРёРµРј РєРѕРїРёРё.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => new Response('', { status: 504, statusText: 'Offline' }));
    })
  );
});
