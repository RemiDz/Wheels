const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { signal } = require('./bowl-fixtures.cjs');
const { createApp } = require('./helpers.cjs');
const { microphone } = require('./bowl-fixtures.cjs');

const context = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'bowl-capture.js'), 'utf8') + '\nthis.api = BowlAudio;', context);
const { detectTone, StableTone } = context.api;
const detect = options => { const s = signal(options); return detectTone(s.spectrum, s.samples, s.sampleRate); };

test('a bowl whose second partial is a little louder still reports its fundamental', () => {
  const result = detect({ tones: [[220, 0.1], [594, 0.14], [1100, 0.05]], noise: 0.0005 });
  assert.ok(Math.abs(result.frequency - 220) < 0.1, JSON.stringify(result));
  // more than 10 dB down, the fundamental is not what the ear hears: the strongest partial wins
  const weak = detect({ tones: [[220, 0.03], [594, 0.4]] });
  assert.ok(Math.abs(weak.frequency - 594) < 0.1, JSON.stringify(weak));
});

test('mains hum is ignored unless it is all there is', () => {
  const withBowl = detect({ tones: [[50, 0.01], [220, 0.00316]], noise: 0.0003 });
  assert.ok(Math.abs(withBowl.frequency - 220) < 0.1, JSON.stringify(withBowl));
  const sixty = detect({ tones: [[60, 0.01], [432, 0.004]], noise: 0.0003 });
  assert.ok(Math.abs(sixty.frequency - 432) < 0.1, JSON.stringify(sixty));
  assert.equal(detect({ tones: [[50, 0.02]], noise: 0.0003 }).frequency, undefined);
});

test('rumble below 40 Hz only masks a bowl when it is far louder; sound above 4 kHz masks at 6 dB', () => {
  const rumble = detect({ tones: [[30, 0.126], [220, 0.05]], noise: 0.0003 });
  assert.ok(Math.abs(rumble.frequency - 220) < 0.1, JSON.stringify(rumble));
  assert.equal(detect({ tones: [[30, 0.5], [220, 0.004]], noise: 0.0003 }).reason, 'range');
  assert.equal(detect({ tones: [[6000, 0.126], [220, 0.05]], noise: 0.0003 }).reason, 'range');
});

test('six comparable partials are a tone, not noise', () => {
  const ratios = [1, 2.7, 5.0, 7.9, 11.3, 15.2];
  const result = detect({ tones: ratios.map(r => [110 * r, 0.05]), noise: 0.0003 });
  assert.ok(Math.abs(result.frequency - 110) < 0.1, JSON.stringify(result));
});

test('a beating bowl locks on the centre of its wobble and one stray reading keeps progress', () => {
  const stable = new StableTone();
  let result;
  for (let i = 0; i < 15; i++) {
    // the reading swings ±10 cents around 221 Hz twice per second, as a split lowest mode does
    result = stable.update({ frequency: 221 * 2 ** ((10 * Math.sin(2 * Math.PI * 2 * i * 0.08)) / 1200) }, i * 80);
  }
  assert.equal(result.locked, true, JSON.stringify(result));
  assert.ok(Math.abs(result.frequency - 221) < 0.5, `locked on ${result.frequency}`);

  const tolerant = new StableTone();
  for (let i = 0; i < 12; i++) tolerant.update({ frequency: 440 }, i * 80);
  const before = tolerant.update({ frequency: 440 }, 12 * 80).progress;
  const outlier = tolerant.update({ frequency: 443 }, 13 * 80);
  assert.ok(outlier.progress >= before, `one stray reading dropped progress from ${before} to ${outlier.progress}`);
  assert.equal(outlier.canLock, true);
});

test('the live capture preview leaves a chosen preset in place; a lock clears it', async () => {
  const app = createApp();
  try {
    const mic = microphone(app, { input: signal({ tones: [[440, 0.3]] }) });
    app.mic = mic;
    app.select('#presetSelect', '2');
    assert.equal(app.document.getElementById('presetSelect').value, '2');
    app.click('#bowlListen');
    await app.tick(1200);
    assert.ok(Math.abs(app.app.wheelL.getHz() - 440) < 0.05, `preview should show the detected tone, wheel at ${app.app.wheelL.getHz()}`);
    assert.equal(app.document.getElementById('presetSelect').value, '2', 'preview cleared the preset');
    app.click('#bowlCancel');
    await app.tick(100);
    assert.equal(app.app.wheelL.getHz(), 136.1, 'cancel should restore the preset frequency');
    assert.equal(app.document.getElementById('presetSelect').value, '2');
    app.click('#bowlListen');
    await app.tick(3000);
    assert.match(app.document.getElementById('bowlStatus').textContent, /Left tone locked/);
    assert.equal(app.document.getElementById('presetSelect').value, '');
  } finally { app.close(); }
});
