const CACHE_NAME = 'nestorium-v12';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './playback-scheduler.js',
  './bowl-capture.js',
  './script.js',
  './manifest.webmanifest',
  './favicon.svg',
  './HarmonicSounds.webp',
  './HarmonicWaves.png',
  './Nestorium_Tutorial.pdf'
];
const assetURLs = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([...assetURLs].map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME &&
      (key.startsWith('nestorium-') || key.startsWith('twin-wheels-')))
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  // Only cache this app's assets, never analytics or unrelated pages.
  if (!assetURLs.has(url.href)) return;
  event.respondWith((async () => {
    let cache;
    try { cache = await caches.open(CACHE_NAME); } catch { /* Online loading also works without cache access. */ }
    const cachedResponse = async () => {
      try { return await cache?.match(url.href); } catch { return undefined; }
    };
    try {
      const fresh = await fetch(request);
      if (cache && fresh.ok && fresh.status === 200 && fresh.type !== 'opaque') {
        try { await cache.put(url.href, fresh.clone()); } catch { /* Storage restrictions must not break online loading. */ }
      }
      if (fresh.status < 500) return fresh;
      return (await cachedResponse()) || fresh;
    } catch {
      return (await cachedResponse()) || Response.error();
    }
  })());
});


