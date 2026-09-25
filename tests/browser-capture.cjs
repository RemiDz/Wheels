// Optional native Chromium check. Uses an isolated profile and generated fake
// microphone files, never the user's microphone or normal browser profile.
// Usage: node tests/browser-capture.cjs "path/to/chrome"
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const exec = promisify(execFile);
const root = path.resolve(__dirname, '..');
const browser = process.argv[2];

async function check(name, amplitude, noise = false) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'nestorium-capture-'));
  const wav = Buffer.alloc(44 + 48000 * 8 * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(48000, 24); wav.writeUInt32LE(96000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  let seed = 12345;
  for (let i = 0; i < 48000 * 8; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = noise ? seed / 0x80000000 - 1 : Math.sin(2 * Math.PI * 440 * i / 48000);
    wav.writeInt16LE(Math.round(amplitude * 32767 * value), 44 + i * 2);
  }
  const audioFile = path.join(temporary, 'input.wav');
  await fs.writeFile(audioFile, wav);
  let result;
  const holds = [];
  const head = `<script>
    window.captureCheck = { errors: [], maxLevel: 0, sawPitch: false };
    addEventListener('error', e => captureCheck.errors.push(String(e.error || e.message)));
    addEventListener('unhandledrejection', e => captureCheck.errors.push(String(e.reason)));
  </script>`;
  const footer = `<script>
    setTimeout(() => document.querySelector('#bowlListen').click(), 100);
    const timer = setInterval(() => {
      captureCheck.maxLevel = Math.max(captureCheck.maxLevel, document.querySelector('#bowlInputLevel').value);
      captureCheck.sawPitch ||= document.querySelector('#bowlLiveFrequency').textContent !== '— Hz';
    }, 100);
    setTimeout(async () => {
      clearInterval(timer);
      captureCheck.captured = document.querySelector('#bowlLeftFrequency').textContent;
      captureCheck.status = document.querySelector('#bowlStatus').textContent;
      document.querySelector('#bowlCancel').click();
      await fetch('/capture-result', { method: 'POST', body: JSON.stringify(captureCheck) });
    }, 7000);
  </script><img src='/capture-hold' hidden>`;
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/capture-result') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        result = JSON.parse(Buffer.concat(chunks)); res.end('ok'); return;
      }
      // Keep page loading long enough for real-time audio before --dump-dom exits.
      if (url.pathname === '/capture-hold') {
        holds.push(setTimeout(() => { res.writeHead(204); res.end(); }, 8500)); return;
      }
      const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (!/^[A-Za-z0-9_.-]+$/.test(name)) { res.writeHead(404); res.end(); return; }
      let body = await fs.readFile(path.join(root, name));
      if (name === 'index.html') body = Buffer.from(body.toString()
        .replace(/<script[^>]+src="https:[\s\S]*?<\/script>/g, '')
        .replace('<head>', '<head>' + head).replace('</body>', footer + '</body>'));
      res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name === 'index.html' ? 'text/html' : 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store'); res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    await exec(browser, ['--headless=new', '--no-first-run', '--no-default-browser-check',
      '--disable-extensions', '--disable-background-networking', '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
      '--use-file-for-fake-audio-capture=' + audioFile, '--user-data-dir=' + path.join(temporary, 'profile'),
      '--dump-dom', '--timeout=15000', 'http://127.0.0.1:' + server.address().port],
    { windowsHide: true, timeout: 25000, maxBuffer: 2000000 });
    assert.ok(result, 'Browser did not return audio observations');
    assert.deepEqual(result.errors, []);
    assert.ok(result.maxLevel > 0, 'The input meter never received sound');
    if (noise) {
      assert.equal(result.captured, 'Not captured');
      assert.equal(result.sawPitch, false);
    } else {
      assert.ok(Math.abs(parseFloat(result.captured) - 440) < 0.2, JSON.stringify(result));
    }
    console.log(JSON.stringify({ name, ...result }));
  } finally {
    holds.forEach(clearTimeout);
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    // Only remove the exact temporary directory this test created.
    const resolved = await fs.realpath(temporary);
    const tempRoot = await fs.realpath(os.tmpdir());
    if (path.dirname(resolved) === tempRoot && path.basename(resolved).startsWith('nestorium-capture-')) {
      await fs.rm(resolved, { recursive: true, force: true }).catch(() => {});
    }
  }
}

(async () => {
  assert.ok(browser, 'Provide the path to an installed Chromium browser');
  await check('normal reference', 0.18);
  await check('quiet reference', 0.001);
  await check('broadband noise', 0.003, true);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
