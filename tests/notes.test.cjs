const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const midiToHz = midi => 440 * 2 ** ((midi - 69) / 12);
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nameOf = midi => NAMES[midi % 12] + (Math.floor(midi / 12) - 1);

test('every piano key frequency rounded to two decimals names its own key with 0 cents', () => {
  const app = createApp();
  try {
    const wrong = [];
    for (let midi = 21; midi <= 108; midi++) {
      const rounded = Number(midiToHz(midi).toFixed(2));
      const info = app.app.frequencyToNote(rounded);
      const detail = app.app.getDetailedFreqInfo(rounded);
      const key = app.app.getKeySpanForFrequency(rounded)?.key?.note;
      if (info.note !== nameOf(midi) || info.cents !== 0 || detail.cents !== 0 || key !== nameOf(midi)) {
        wrong.push(`${nameOf(midi)} ${rounded} -> ${info.note} +${info.cents}c key ${key}`);
      }
    }
    assert.deepEqual(wrong, []);
    // Beyond half a cent below a note, the note below is still reported with high cents.
    const below = app.app.frequencyToNote(midiToHz(69.994));
    assert.equal(below.note, 'A4');
    assert.equal(below.cents, 99);
    assert.equal(app.app.frequencyToNote(midiToHz(69.996)).note, 'A#4');
  } finally { app.close(); }
});

test('A#4 at 466.16 Hz highlights and labels the A#4 key', async () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(466.16);
    await app.tick(150); // highlights and readouts follow on the next frame
    const lit = [...app.document.querySelectorAll('.piano-key.is-left')].map(key => key.dataset.note);
    assert.deepEqual(lit, ['A#4']);
    assert.equal(app.document.getElementById('leftWheelNote').textContent, 'A#4');
    assert.equal(app.document.getElementById('leftWheelOffset').textContent, '+0.0Hz');
    assert.equal(app.document.querySelector('.piano-key.is-left').style.getPropertyValue('--left-fill'), '0.000');
  } finally { app.close(); }
});

test('the C major scale frequencies fall on white keys only', async () => {
  const app = createApp();
  try {
    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const lit = [];
    for (const hz of scale) {
      app.app.wheelL.setHz(hz); await app.tick(150);
      lit.push(app.document.querySelector('.piano-key.is-left').dataset.note);
    }
    assert.deepEqual(lit, ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);
  } finally { app.close(); }
});

test('frequencies below A0 light no key and 27.5 Hz lights A0', async () => {
  const app = createApp();
  try {
    await app.tick(150);
    assert.equal(app.document.querySelector('.piano-key.is-left'), null, 'the 0.1 Hz start value lit a key');
    for (const hz of [7.83, 20, 26]) {
      app.app.wheelL.setHz(hz); await app.tick(150);
      assert.equal(app.document.querySelector('.piano-key.is-left'), null, `${hz} Hz lit a key`);
    }
    app.app.wheelL.setHz(27.5); await app.tick(150);
    assert.equal(app.document.querySelector('.piano-key.is-left').dataset.note, 'A0');
    app.app.wheelL.setHz(4200); await app.tick(150);
    assert.equal(app.document.querySelector('.piano-key.is-left').dataset.note, 'C8');
  } finally { app.close(); }
});

test('the Scale lesson highlights only white keys and the Overtones lesson lights C#6 for 1100 Hz', async () => {
  const app = createApp();
  try {
    const seen = new Set();
    app.select('#conceptSelect', 'scale'); app.click('#explanationDemo .demo-btn');
    for (let i = 0; i < 40; i++) {
      await app.tick(100);
      app.document.querySelectorAll('.piano-key.school-demo-active').forEach(key => seen.add(key.dataset.note));
    }
    assert.deepEqual([...seen].sort(), ['A4', 'B4', 'C4', 'C5', 'D4', 'E4', 'F4', 'G4']);
    app.click('#stop');
    seen.clear();
    app.select('#conceptSelect', 'overtones'); app.click('#explanationDemo .demo-btn');
    for (let i = 0; i < 40; i++) {
      await app.tick(100);
      app.document.querySelectorAll('.piano-key.school-demo-active').forEach(key => seen.add(key.dataset.note));
    }
    assert.ok(seen.has('C#6'), `1100 Hz lit ${[...seen].join(',')}`);
    assert.ok(!seen.has('C6'));
  } finally { app.close(); }
});
