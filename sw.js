// Caché del juego: la ciudad (15 MB), el código y Three.js quedan guardados en el teléfono para jugar
// sin conexión (la conversación con la IA sí necesita internet).
//  - Código y páginas: primero la red (revalidando, para no mezclar versiones); la caché es el respaldo.
//  - Datos pesados (modelos, audios) y Three.js: desde la caché, actualizándose en segundo plano.
const CACHE = 'santiago-antiguo-v3';
const PREVIO = ['./', './index.html', './juego.js', './datos/instancias.json', './datos/ciudad.glb', './datos/colision.glb'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PREVIO.map((u) => new Request(u, { cache: 'reload' })))).catch(() => {}));
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
  const pesado = cdn || /\.(glb|mp3|png|webmanifest)$/.test(url.pathname);
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const guardada = await c.match(r, { ignoreSearch: propio });
    const red = fetch(r, propio ? { cache: 'no-cache' } : undefined)
      .then((resp) => { if (resp.ok) c.put(r, resp.clone()); return resp; });
    if (pesado) return guardada || red;
    return red.catch(() => guardada);
  }));
});
