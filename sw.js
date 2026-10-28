// Caché del juego: la ciudad (15 MB), el código y Three.js quedan guardados en el teléfono.
// Se sirven desde la caché y se actualizan en segundo plano, así la segunda visita carga al instante
// y se puede pasear sin conexión (la conversación con la IA sí necesita internet).
const CACHE = 'santiago-antiguo-v1';
const PREVIO = ['./', './index.html', './juego.js', './datos/instancias.json', './datos/ciudad.glb', './datos/colision.glb'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PREVIO)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  const propio = url.origin === location.origin;
  const cdn = /cdn\.jsdelivr\.net$/.test(url.hostname);
  if (!propio && !cdn) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const guardada = await c.match(r, { ignoreSearch: propio });
    const red = fetch(r).then((resp) => { if (resp.ok) c.put(r, resp.clone()); return resp; }).catch(() => guardada);
    return guardada || red;
  }));
});
