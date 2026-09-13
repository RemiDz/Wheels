const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function worker({ prefix = '/', storageFails = false } = {}) {
  const scope = 'https://example.test' + prefix;
  const handlers = {};
  const stores = new Map();
  let network = true;
  let networkStatus = 200;
  let networkBody = 'fresh';
  let claimed = false;
  let skipped = false;
  const caches = {
    async keys() { return [...stores.keys()]; },
    async delete(key) { return stores.delete(key); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(requests) {
          for (const request of requests) {
            const file = decodeURIComponent(new URL(request.url).pathname.slice(prefix.length)) || 'index.html';
            assert.ok(fs.existsSync(path.join(__dirname, '..', file)), file + ' must ship with the app');
            assert.equal(request.cache, 'reload');
            store.set(request.url, new Response('cached:' + file));
          }
        },
        async match(url) { return store.get(url)?.clone(); },
        async put(url, response) {
          if (storageFails) throw new Error('Quota exceeded');
          store.set(url, response.clone());
        },
      };
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf8'), {
    caches, URL, Request, Response,
    fetch: async () => { if (!network) throw new TypeError('Offline'); return new Response(networkBody, { status: networkStatus }); },
    self: { registration: { scope }, addEventListener: (name, fn) => { handlers[name] = fn; },
      skipWaiting: async () => { skipped = true; }, clients: { claim: async () => { claimed = true; } } },
  });
  return { stores, caches,
    offline() { network = false; },
    response(status, body) { network = true; networkStatus = status; networkBody = body; },
    get lifecycle() { return { claimed, skipped }; },
    async dispatch(name) { let pending; handlers[name]({ waitUntil(promise) { pending = promise; } }); await pending; },
    async fetch(file, method = 'GET') {
      let response;
      handlers.fetch({ request: new Request(new URL(file, scope), { method }), respondWith(promise) { response = promise; } });
      return response;
    },
  };
}

test('precache contains the complete app and tutorial, including a subdirectory install', async () => {
  const env = worker({ prefix: '/nestorium/' }); await env.dispatch('install'); env.offline();
  for (const file of ['', 'index.html', 'script.js', 'playback-scheduler.js', 'styles.css', 'Nestorium_Tutorial.pdf', 'HarmonicSounds.webp']) {
    const response = await env.fetch(file); assert.equal(response.status, 200, file);
  }
  assert.equal(env.lifecycle.skipped, true);
});

test('activation removes only obsolete Nestorium caches and claims clients', async () => {
  const env = worker();
  await env.caches.open('unrelated-app-v1'); await env.caches.open('twin-wheels-v1');
  await env.dispatch('install'); await env.dispatch('activate');
  assert.equal(env.stores.has('unrelated-app-v1'), true);
  assert.equal(env.stores.has('twin-wheels-v1'), false);
  assert.equal(env.lifecycle.claimed, true);
});

test('fresh assets replace cached versions and query strings work offline', async () => {
  const env = worker(); await env.dispatch('install');
  assert.equal(await (await env.fetch('script.js')).text(), 'fresh');
  env.offline(); assert.equal(await (await env.fetch('script.js?v=2')).text(), 'fresh');
  assert.ok((await (await env.fetch('?campaign=test')).text()).startsWith('cached:'));
});

test('analytics, unrelated files and POST requests bypass offline caching', async () => {
  const env = worker();
  for (const file of ['https://plausible.io/script.js', 'missing.js', 'https://another.test/script.js']) assert.equal(await env.fetch(file), undefined);
  assert.equal(await env.fetch('index.html', 'POST'), undefined);
});

test('server failures use known-good assets and are never cached', async () => {
  const env = worker(); await env.dispatch('install'); env.response(503, 'unavailable');
  assert.equal(await (await env.fetch('script.js')).text(), 'cached:script.js');
  env.response(404, 'missing'); assert.equal((await env.fetch('script.js')).status, 404);
  env.offline(); assert.equal(await (await env.fetch('script.js')).text(), 'cached:script.js');
});

test('cache quota failure does not prevent a successful network response', async () => {
  const env = worker({ storageFails: true }); await env.dispatch('install');
  assert.equal(await (await env.fetch('script.js')).text(), 'fresh');
});

test('offline uncached app resources return a Response rather than undefined', async () => {
  const env = worker(); env.offline(); const response = await env.fetch('script.js');
  assert.ok(response instanceof Response); assert.equal(response.type, 'error');
});
