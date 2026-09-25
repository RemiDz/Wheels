const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { signal } = require('./bowl-fixtures.cjs');
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'bowl-capture.js'), 'utf8') + '\nthis.api = BowlAudio;', context);
const { detectTone, StableTone, describeInterval } = context.api;
const detect = options => { const s = signal(options); return detectTone(s.spectrum, s.samples, s.sampleRate); };

for (const sampleRate of [44100, 48000, 96000]) {
  test(`measures known pitches across the bowl range at ${sampleRate} Hz sample rate`, () => {
    for (const frequency of [40.3, 55, 110.25, 136.1, 174, 261.63, 432, 440, 528, 963, 1000, 3990]) {
      const result = detect({ sampleRate, tones: [[frequency, 0.2]] });
      assert.ok(Math.abs(result.frequency - frequency) < 0.15, `${frequency}: ${JSON.stringify(result)}`);
    }
  });
}

test('detects the strongest inharmonic partial instead of inventing a bowl fundamental', () => {
  const result = detect({ tones: [[110, 0.08], [277.1, 0.4], [546.7, 0.2]], noise: 0.025 });
  assert.ok(Math.abs(result.frequency - 277.1) < 0.1);
  const harmonic = detect({ tones: [[220, 0.1], [440, 0.4], [660, 0.15]] });
  assert.ok(Math.abs(harmonic.frequency - 440) < 0.1);
});

test('quiet input, broadband noise, a strike transient, clipping and out-of-range tones cannot lock', () => {
  for (const options of [
    { tones: [] }, { tones: [[440, 0.0001]] }, { tones: [], noise: 0.2 },
    { tones: [], impulse: true }, { tones: [[440, 2]], clip: true },
    { tones: [[25, 0.3]] }, { tones: [[5000, 0.3]] }
  ]) assert.equal(detect(options).frequency, undefined, JSON.stringify(options));
});

test('DC offset is excluded from input level and does not shift a real tone', () => {
  assert.equal(detect({ tones: [], dc: 0.2 }).frequency, undefined);
  assert.ok(Math.abs(detect({ tones: [[432, 0.1]], dc: 0.2 }).frequency - 432) < 0.1);
});

test('quiet sustained notes pass while similarly quiet broadband noise and silence do not', () => {
  for (const frequency of [110, 440, 136.1, 963, 2000]) {
    const result = detect({ tones: [[frequency, 0.001]], noise: 0.0002 });
    assert.ok(Math.abs(result.frequency - frequency) < 0.2, JSON.stringify(result));
  }
  for (const noise of [0, 0.0002, 0.001, 0.003]) {
    assert.equal(detect({ tones: [], noise }).frequency, undefined);
  }
});

test('stable capture waits for sustained pitch; silence and note changes restart the window', () => {
  const stable = new StableTone();
  let result;
  for (let i = 0; i < 14; i++) {
    result = stable.update({ frequency: 440 + (i % 2 ? 0.1 : -0.1) }, i * 80);
    assert.equal(result.locked, false);
  }
  result = stable.update({ frequency: 440 }, 1120);
  assert.equal(result.locked, true);
  assert.ok(Math.abs(result.frequency - 440) < 0.1);
  assert.equal(stable.update({}, 1200).canLock, false);
  assert.equal(stable.update({ frequency: 440 }, 1280).progress, 0);
  assert.equal(stable.update({ frequency: 660 }, 1360).progress, 0);
  assert.equal(stable.update({ frequency: 660 }, 2000).progress, 0);
});

test('a drifting or alternating partial never becomes a falsely stable pitch', () => {
  const drift = new StableTone(), alternate = new StableTone();
  for (let i = 0; i < 150; i++) {
    assert.equal(drift.update({ frequency: 440 + i * 0.4 }, i * 80).locked, false);
    assert.equal(alternate.update({ frequency: i % 2 ? 220 : 440 }, i * 80).locked, false);
  }
});

test('intervals retain fractional cents, handle reversed channels and compound intervals', () => {
  const fifth = describeInterval(440, 660);
  assert.equal(fifth.name, 'Perfect fifth');
  assert.equal(fifth.ratio, 1.5);
  assert.ok(Math.abs(fifth.cents - 701.955) < 0.001);
  assert.ok(Math.abs(fifth.deviation - 1.955) < 0.001);
  assert.equal(describeInterval(660, 440).name, fifth.name);
  assert.equal(describeInterval(440, 440).name, 'Unison');
  assert.equal(describeInterval(220, 440).name, 'Octave');
  assert.equal(describeInterval(110, 440).name, '2 octaves');
  assert.equal(describeInterval(220, 660).name, 'Octave + perfect fifth');
  assert.equal(describeInterval(440, 440 * 2 ** (1 / 12)).name, 'Minor second');
  for (const bad of [0, -1, NaN, Infinity, null, 10]) assert.equal(describeInterval(bad, 440), null);
});
