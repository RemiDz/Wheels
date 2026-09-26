const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');
const { signal, microphone } = require('./bowl-fixtures.cjs');

function setup(t, options) {
  const env = createApp();
  const mic = microphone(env, options);
  t.after(() => { env.window.dispatchEvent(new env.window.Event('pagehide')); env.close(); });
  const target = side => {
    const input = env.document.querySelector(`input[name="bowlTarget"][value="${side}"]`);
    input.checked = true; input.dispatchEvent(new env.window.Event('change', { bubbles: true }));
  };
  return { ...env, mic, target };
}

test('captures two instrument tones independently, updates the piano and replays the saved pair in true stereo', async t => {
  const env = setup(t);
  assert.equal(env.mic.requests.length, 0, 'No microphone access before a user action');
  env.app.wheelL.setHz(174); env.app.wheelR.setHz(285);
  env.click('#bowlListen'); await env.tick(1050);
  assert.ok(Math.abs(env.app.wheelL.getHz() - 440) < 0.1, 'Left wheel follows the live detected pitch');
  assert.equal(env.app.wheelR.getHz(), 285);
  assert.equal(env.document.querySelectorAll('.piano-key.is-left').length, 1);
  await env.tick(1200);
  const left = env.app.wheelL.getHz();
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.equal(env.mic.contexts[0].state, 'closed');
  assert.equal(env.mic.sources[0].connections.length, 1, 'Input connects only to the analyser');
  assert.equal(env.app.state.audioCtx, null, 'Capture never starts playback');
  assert.match(env.document.querySelector('#bowlLeftNote').textContent, /A4/);

  env.target('right'); env.mic.input = signal({ tones: [[660, 0.3]] });
  env.click('#bowlListen'); await env.tick(2300);
  const right = env.app.wheelR.getHz();
  assert.equal(env.app.wheelL.getHz(), left, 'The first tone remains locked');
  assert.ok(Math.abs(right - 660) < 0.1);
  assert.match(env.document.querySelector('#bowlInterval').textContent, /Perfect fifth/);
  assert.ok(Math.abs(parseFloat(env.document.querySelector('#bowlIntervalDetail').textContent) - 1.5) < 0.001);
  assert.equal(env.document.querySelectorAll('.piano-key.is-right').length, 1);
  assert.match(env.document.querySelector('#bowlPianoSummary').textContent, /Left.*A4.*Right.*E5.*Perfect fifth/);

  env.app.wheelL.setHz(100); env.app.wheelR.setHz(200);
  env.click('.mute-btn[data-wheel="wheelL"]');
  env.click('#bowlPlayPair'); await env.tick(100);
  assert.equal(env.app.wheelL.getHz(), left); assert.equal(env.app.wheelR.getHz(), right);
  assert.equal(env.app.state.wheel1.panner.pan.value, -1);
  assert.equal(env.app.state.wheel2.panner.pan.value, 1);
  assert.equal(env.app.state.monoGain.gain.value, 0);
  assert.equal(env.app.state.wheelLMuted, false); assert.equal(env.app.state.wheelRMuted, false);
  assert.equal(env.app.state.wheel1.osc.running, true); assert.equal(env.app.state.wheel2.osc.running, true);
  assert.ok(env.mic.streams.every(s => s.track.readyState === 'ended'));
  env.click('#bowlViewPiano'); assert.equal(env.document.activeElement.id, 'pianoReference');
  env.click('#reset');
  assert.equal(env.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
  assert.equal(env.document.querySelector('#bowlPlayPair').disabled, true);
});

test('microphone capture stops a running journey and never feeds it back to the input', async t => {
  const env = setup(t);
  await env.app.startQuickStart('focus'); await env.tick(100);
  const context = env.app.state.audioCtx;
  env.click('#bowlListen'); await env.tick(2300);
  assert.equal(env.app.state.quickStartRunning, false);
  assert.equal(context.oscillators.filter(o => o.running).length, 0);
  assert.equal(env.app.state.wheel1, null);
  assert.equal(env.mic.requests[0].constraints.video, false);
  assert.equal(env.mic.requests[0].constraints.audio.echoCancellation, false);
});

for (const [name, cancel] of [
  ['Cancel', env => env.click('#bowlCancel')], ['Stop', env => env.click('#stop')],
  ['Pause', env => env.click('#pause')], ['channel switch', env => env.target('right')],
  ['Escape', env => env.key('#bowlListen', 'Escape')],
  ['page exit', env => env.window.dispatchEvent(new env.window.Event('pagehide'))],
  ['hidden tab', env => { Object.defineProperty(env.document, 'hidden', { configurable: true, value: true }); env.document.dispatchEvent(new env.window.Event('visibilitychange')); }]
]) {
  test(`${name} releases a live microphone and restores the uncommitted wheel frequency`, async t => {
    const env = setup(t); env.app.wheelL.setHz(222); env.app.wheelR.setHz(333);
    env.click('#bowlListen'); await env.tick(1000);
    assert.ok(Math.abs(env.app.wheelL.getHz() - 440) < 0.1);
    cancel(env); await env.tick(1500);
    assert.equal(env.app.wheelL.getHz(), 222); assert.equal(env.app.wheelR.getHz(), 333);
    assert.equal(env.mic.streams[0].track.readyState, 'ended');
    assert.equal(env.mic.contexts[0].state, 'closed');
    assert.equal(env.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
  });
}

test('late microphone permission cannot revive a cancelled capture or overwrite a newer one', async t => {
  const env = setup(t, { pending: true }); env.app.wheelL.setHz(222);
  env.click('#bowlListen'); await env.tick(10);
  env.click('#bowlCancel'); env.target('right'); env.click('#bowlListen');
  env.mic.requests[1].grant(); await env.tick(500);
  env.mic.requests[0].grant(); await env.tick(1900);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.equal(env.mic.streams[1].track.readyState, 'ended');
  assert.equal(env.app.wheelL.getHz(), 222);
  assert.ok(Math.abs(env.app.wheelR.getHz() - 440) < 0.1);
  assert.match(env.document.querySelector('#bowlStatus').textContent, /Right tone locked/);
});

for (const failure of ['NotAllowedError', 'NotFoundError', 'NotReadableError']) {
  test(`${failure} preserves the wheels and releases the capture context`, async t => {
    const env = setup(t, { rejection: failure }); env.app.wheelL.setHz(222);
    env.click('#bowlListen'); await env.tick(100);
    assert.equal(env.app.wheelL.getHz(), 222);
    assert.equal(env.mic.contexts[0].state, 'closed');
    assert.equal(env.document.querySelector('#bowlListen').disabled, false);
    assert.match(env.document.querySelector('#bowlStatus').textContent, /denied|No microphone|unavailable/);
  });
}

test('silence never enables Lock and capture times out with the microphone off', async t => {
  const env = setup(t, { input: signal({ tones: [] }) }); env.app.wheelL.setHz(222);
  env.click('#bowlListen'); await env.tick(5000);
  assert.equal(env.document.querySelector('#bowlLock').disabled, true);
  assert.equal(env.app.wheelL.getHz(), 222);
  await env.tick(41000);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.match(env.document.querySelector('#bowlStatus').textContent, /No steady tone was heard/);
});

test('manual Lock accepts a recent valid pitch and microphone disconnection discards a preview', async t => {
  const env = setup(t); env.click('#bowlListen'); await env.tick(1400); // Lock needs about half a second of steady readings
  assert.equal(env.document.querySelector('#bowlLock').disabled, false);
  env.click('#bowlLock');
  assert.match(env.document.querySelector('#bowlStatus').textContent, /Left tone locked/);
  const captured = env.app.wheelL.getHz();
  env.mic.input = signal({ tones: [[528, 0.3]] }); env.click('#bowlListen'); await env.tick(1000);
  env.mic.streams[1].track.dispatchEvent(new env.window.Event('ended'));
  assert.equal(env.app.wheelL.getHz(), captured);
  assert.match(env.document.querySelector('#bowlStatus').textContent, /disconnected/);
});

test('manual wheel takeover keeps the new user pitch while cancelling microphone updates', async t => {
  const env = setup(t); env.app.wheelL.setHz(222);
  env.click('#bowlListen'); await env.tick(1000);
  env.app.wheelL.setHz(330, true); await env.tick(1500);
  assert.equal(env.app.wheelL.getHz(), 330);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.equal(env.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
});

test('unsupported microphone APIs leave the rest of the app usable', async t => {
  const env = setup(t);
  Object.defineProperty(env.window.navigator, 'mediaDevices', { value: undefined });
  env.click('#bowlListen'); await env.tick(100);
  assert.match(env.document.querySelector('#bowlStatus').textContent, /HTTPS or localhost/);
  env.click('#play'); await env.tick(100);
  assert.equal(env.app.state.wheel1.osc.running, true);
});

test('Play cancels an unfinished capture before generating sound', async t => {
  const env = setup(t); env.app.wheelL.setHz(222); env.app.wheelR.setHz(333);
  env.click('#bowlListen'); await env.tick(1000);
  env.click('#play'); await env.tick(1500);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.equal(env.app.wheelL.getHz(), 222); assert.equal(env.app.wheelR.getHz(), 333);
  assert.equal(env.app.state.wheel1.osc.running, true);
  assert.equal(env.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
});

test('starting a journey takes ownership from the microphone without a later capture overwrite', async t => {
  const env = setup(t); env.click('#bowlListen'); await env.tick(1000);
  await env.app.startQuickStart('focus'); await env.tick(2500);
  assert.equal(env.app.state.quickStartRunning, true);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.equal(env.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
});

test('Reset cancels pending permission, clears captured tones and ignores a late grant', async t => {
  const env = setup(t, { pending: true });
  env.click('#bowlListen'); env.mic.requests[0].grant(); await env.tick(2300);
  env.target('right'); env.click('#bowlListen'); await env.tick(10);
  env.click('#reset'); env.mic.requests[1].grant(); await env.tick(2300);
  assert.equal(env.app.wheelL.getHz(), 0.1); assert.equal(env.app.wheelR.getHz(), 0.1);
  assert.equal(env.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
  assert.equal(env.document.querySelector('#bowlRightFrequency').textContent, 'Not captured');
  assert.ok(env.mic.streams.every(s => s.track.readyState === 'ended'));
});

test('an ignored permission prompt times out, and granting it later immediately releases the microphone', async t => {
  const env = setup(t, { pending: true }); env.click('#bowlListen'); await env.tick(45100);
  assert.equal(env.mic.contexts[0].state, 'closed');
  assert.equal(env.document.querySelector('#bowlListen').disabled, false);
  env.mic.requests[0].grant(); await env.tick(100);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.equal(env.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
});

test('a late permission error from an old request cannot cancel or relabel a new capture', async t => {
  const env = setup(t, { pending: true });
  env.click('#bowlListen'); env.target('right'); env.click('#bowlListen');
  env.mic.requests[1].grant(); await env.tick(100);
  env.mic.requests[0].reject(Object.assign(new Error('Old request denied'), { name: 'NotAllowedError' }));
  await env.tick(2300);
  assert.match(env.document.querySelector('#bowlStatus').textContent, /Right tone locked/);
  assert.equal(env.mic.streams[1].track.readyState, 'ended');
});

test('a lost tone cannot be manually locked from a stale reading', async t => {
  const env = setup(t); env.click('#bowlListen'); await env.tick(1400);
  assert.equal(env.document.querySelector('#bowlLock').disabled, false);
  env.mic.input = signal({ tones: [] }); await env.tick(100);
  assert.equal(env.document.querySelector('#bowlLock').disabled, true);
  env.click('#bowlLock');
  assert.equal(env.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
});

test('capture leaves overtone playback and shows the wheel notes on the piano', async t => {
  const env = setup(t); env.app.wheelL.setHz(220);
  env.click('#overtoneHighlightToggle'); await env.tick(100);
  env.click('#bowlListen'); await env.tick(2300);
  assert.equal(env.app.state.showOvertoneHighlights, false);
  assert.equal(env.app.state.harmonicsPlaying, false);
  assert.equal(env.document.querySelectorAll('.piano-key.is-left').length, 1);
  assert.equal(env.document.querySelectorAll('.piano-key.is-overtone').length, 0);
});

test('an interrupted microphone context releases its stream and keeps the previous wheel value', async t => {
  const env = setup(t); env.app.wheelL.setHz(222);
  env.click('#bowlListen'); await env.tick(1000);
  env.mic.contexts[0].state = 'suspended'; await env.tick(100);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.equal(env.app.wheelL.getHz(), 222);
  assert.match(env.document.querySelector('#bowlStatus').textContent, /interrupted/);
});

test('a quiet microphone tone is visible on the input meter and captures accurately', async t => {
  const env = setup(t, { input: signal({ tones: [[440, 0.001]], noise: 0.0002 }) });
  env.click('#bowlListen'); await env.tick(1100);
  assert.ok(Math.abs(env.app.wheelL.getHz() - 440) < 0.2);
  assert.ok(env.document.querySelector('#bowlInputLevel').value > 0);
  const sink = env.mic.gains[0];
  assert.equal(sink.gain.value, 0, 'Microphone output remains completely muted');
  assert.equal(sink.connections[0], env.mic.contexts[0].destination);
  await env.tick(1400);
  assert.match(env.document.querySelector('#bowlLeftFrequency').textContent, /440/);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.equal(sink.connections.length, 0, 'The silent output is released after capture');
});

test('capture can start when the audio clock runs but the resume promise stays pending', async t => {
  const env = setup(t, { pendingResume: true });
  env.click('#bowlListen'); await env.tick(2500);
  assert.match(env.document.querySelector('#bowlLeftFrequency').textContent, /440/);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
});

test('an audio engine that never starts releases the allowed microphone and reports the startup failure', async t => {
  const env = setup(t, { stalled: true }); env.app.wheelL.setHz(222);
  env.click('#bowlListen'); await env.tick(200);
  assert.match(env.document.querySelector('#bowlStatus').textContent, /Starting/);
  await env.tick(6100);
  assert.match(env.document.querySelector('#bowlStatus').textContent, /audio engine did not start/);
  assert.equal(env.mic.streams[0].track.readyState, 'ended');
  assert.equal(env.mic.contexts[0].state, 'closed');
  assert.equal(env.document.querySelector('#bowlListen').disabled, false);
  assert.equal(env.app.wheelL.getHz(), 222);
});

test('the input meter distinguishes silence from unpitched sound without locking either', async t => {
  const env = setup(t, { input: signal({ tones: [] }) });
  env.click('#bowlListen'); await env.tick(1500);
  assert.equal(env.document.querySelector('#bowlInputLevel').value, 0);
  assert.match(env.document.querySelector('#bowlStatus').textContent, /No microphone signal/);
  env.mic.input = signal({ tones: [], noise: 0.003 }); await env.tick(1500);
  assert.ok(env.document.querySelector('#bowlInputLevel').value > 0);
  assert.match(env.document.querySelector('#bowlStatus').textContent, /No clear tone/);
  assert.equal(env.document.querySelector('#bowlLock').disabled, true);
  assert.equal(env.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
});

test('captured tones are saved in local storage and come back on the next visit', async t => {
  const env = setup(t);
  env.click('#bowlListen'); await env.tick(2300);
  env.target('right'); env.mic.input = signal({ tones: [[660, 0.3]] });
  env.click('#bowlListen'); await env.tick(2300);
  const left = env.app.wheelL.getHz(), right = env.app.wheelR.getHz();
  const saved = JSON.parse(env.window.localStorage.getItem('nestorium-captured-tones'));
  assert.equal(saved.left, left); assert.equal(saved.right, right);
  assert.ok(Number.isFinite(saved.savedAt));

  // a later visit: the pair is listed, Play both is lit and restores the wheels
  const later = createApp({ seedStorage: { 'nestorium-captured-tones': JSON.stringify({ ...saved, savedAt: Date.UTC(2026, 8, 25, 12) }) } });
  t.after(() => later.close());
  assert.equal(later.errors.length, 0);
  assert.equal(later.document.querySelector('#bowlLeftFrequency').textContent, `${left.toFixed(2)} Hz`);
  assert.equal(later.document.querySelector('#bowlRightFrequency').textContent, `${right.toFixed(2)} Hz`);
  assert.match(later.document.querySelector('#bowlInterval').textContent, /Perfect fifth/);
  assert.equal(later.document.querySelector('#bowlPlayPair').disabled, false);
  assert.match(later.document.querySelector('#bowlStatus').textContent, /Both captured tones from 25 Sept? are saved: press Play both/);
  assert.equal(later.app.wheelL.getHz(), 0.1, 'restoring does not move the wheels by itself');
  later.click('#bowlPlayPair'); await later.tick(100);
  assert.equal(later.app.wheelL.getHz(), left); assert.equal(later.app.wheelR.getHz(), right);
  assert.equal(later.app.state.wheel1.osc.running, true);
  later.click('#reset');
  assert.equal(later.window.localStorage.getItem('nestorium-captured-tones'), null, 'Reset forgets the pair');
  assert.equal(later.document.querySelector('#bowlPlayPair').disabled, true);
});

test('a single saved tone, damaged storage and blocked storage are all handled', async t => {
  const single = createApp({ seedStorage: { 'nestorium-captured-tones': JSON.stringify({ left: null, right: 528, savedAt: 1 }) } });
  t.after(() => single.close());
  assert.equal(single.document.querySelector('#bowlLeftFrequency').textContent, 'Not captured');
  assert.equal(single.document.querySelector('#bowlRightFrequency').textContent, '528.00 Hz');
  assert.equal(single.document.querySelector('#bowlPlayPair').disabled, true, 'needs both tones');
  assert.match(single.document.querySelector('#bowlStatus').textContent, /Your captured right tone from .* is saved\./);

  for (const junk of ['{', '[1,2]', JSON.stringify({ left: 5, right: 99999 }), JSON.stringify({ left: 'a', right: null })]) {
    const damaged = createApp({ seedStorage: { 'nestorium-captured-tones': junk } });
    assert.equal(damaged.errors.length, 0, junk);
    assert.equal(damaged.document.querySelector('#bowlPlayPair').disabled, true, junk);
    assert.equal(damaged.document.querySelector('#bowlStatus').textContent, 'Microphone off.', junk);
    damaged.close();
  }

  const blocked = createApp({ blockedStorage: true });
  const mic = microphone(blocked);
  t.after(() => { blocked.window.dispatchEvent(new blocked.window.Event('pagehide')); blocked.close(); });
  blocked.click('#bowlListen'); await blocked.tick(2300);
  assert.equal(blocked.errors.length, 0);
  assert.match(blocked.document.querySelector('#bowlLeftFrequency').textContent, /^(439|440)\.\d\d Hz$/, 'capture works without storage');
  assert.ok(mic.streams.every(s => s.track.readyState === 'ended'));
});

test('captured tones stay marked on the piano and the wheels while the wheels move, and the markers bring them back', async t => {
  const env = setup(t);
  env.click('#bowlListen'); await env.tick(2300);
  env.target('right'); env.mic.input = signal({ tones: [[660, 0.3]] });
  env.click('#bowlListen'); await env.tick(2300);
  const left = env.app.wheelL.getHz(), right = env.app.wheelR.getHz();
  const q = s => env.document.querySelector(s);
  const markerL = q('.captured-marker-left'), markerR = q('.captured-marker-right');
  assert.ok(markerL && markerR, 'one marker per captured side');
  assert.equal(markerL.dataset.letter, 'L'); assert.equal(markerR.dataset.letter, 'R');
  assert.equal(markerL.closest('.piano-key').dataset.note, 'A4');
  assert.equal(markerR.closest('.piano-key').dataset.note, 'E5');
  assert.equal(markerL.closest('.piano-key').classList.contains('is-left'), true, 'the live fill and the marker start on the same key');
  assert.ok(Math.abs(parseFloat(markerL.style.getPropertyValue('--captured-fill')) - env.app.getKeySpanForFrequency(left).ratio) < 0.001);
  assert.equal(q('#capturedTonesButton').disabled, false);
  assert.equal(q('#wheelL .bands .bookmark').dataset.hz, String(left));
  assert.equal(q('#wheelR .bands .bookmark').dataset.hz, String(right));
  assert.equal(q('#wheelL .bands .bookmark circle').getAttribute('fill'), markerL.style.getPropertyValue('--captured-color'));

  // an accidental piano tap moves the left wheel: the live fill moves, the marker stays
  q('.piano-key[data-note="C4"]').dispatchEvent(new env.window.PointerEvent('pointerdown', { bubbles: true, button: 0 }));
  await env.tick(250);
  assert.notEqual(env.app.wheelL.getHz(), left);
  assert.equal(q('.piano-key.is-left').dataset.note, 'C4');
  assert.equal(q('.captured-marker-left'), markerL, 'same marker element, not rebuilt');
  assert.equal(markerL.closest('.piano-key').dataset.note, 'A4');
  assert.equal(q('#wheelL .bands .bookmark').dataset.hz, String(left), 'the wheel bookmark stays too');

  // tapping the marker brings only that wheel back
  env.app.wheelR.setHz(300);
  markerL.dispatchEvent(new env.window.PointerEvent('pointerdown', { bubbles: true, button: 0 }));
  await env.tick(250);
  assert.equal(env.app.wheelL.getHz(), left);
  assert.equal(env.app.wheelR.getHz(), 300, 'the other wheel is left alone');
  assert.equal(q('.piano-key.is-left').dataset.note, 'A4');
  assert.equal(env.app.state.wheel1.osc.running, true, 'and it plays');

  // the Piano Reference button restores the stereo pair like Play both
  env.click('.mute-btn[data-wheel="wheelR"]');
  env.click('#capturedTonesButton'); await env.tick(250);
  assert.equal(env.app.wheelL.getHz(), left); assert.equal(env.app.wheelR.getHz(), right);
  assert.equal(env.app.state.wheelRMuted, false);
  assert.equal(env.app.state.wheel1.panner.pan.value, -1); assert.equal(env.app.state.wheel2.panner.pan.value, 1);

  // Enter on a focused marker works like a tap; Reset clears everything
  env.app.wheelR.setHz(300);
  markerR.dispatchEvent(new env.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await env.tick(250);
  assert.equal(env.app.wheelR.getHz(), right);
  env.click('#reset');
  assert.equal(q('.captured-marker'), null);
  assert.equal(q('.bands .bookmark'), null);
  assert.equal(q('#capturedTonesButton').disabled, true);
});

test('a saved pair from an earlier visit is marked as soon as the page opens', () => {
  const app = createApp({ seedStorage: { 'nestorium-captured-tones': JSON.stringify({ left: 261.63, right: 392, savedAt: 1 }) } });
  try {
    assert.equal(app.errors.length, 0);
    assert.equal(app.document.querySelector('.captured-marker-left').closest('.piano-key').dataset.note, 'C4');
    assert.equal(app.document.querySelector('.captured-marker-right').closest('.piano-key').dataset.note, 'G4');
    assert.equal(app.document.querySelectorAll('.bands .bookmark').length, 2);
    assert.equal(app.document.querySelector('#capturedTonesButton').disabled, false);
    assert.equal(app.document.querySelector('.piano-key.is-left'), null, 'the wheels have not moved yet');
  } finally { app.close(); }
});
