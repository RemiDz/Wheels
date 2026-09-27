const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const STEP = 360 / 34; // degrees per anchor sector
const midiToHz = midi => 440 * 2 ** ((midi - 69) / 12);
// the wheel's own mapping: linear in Hz between two anchors
const angleOf = (hz, a, b, index) => index * STEP + (hz - a) / (b - a) * STEP;
const point = (radius, angle) => {
  const rad = (angle - 90) * Math.PI / 180;
  return [(100 + radius * Math.cos(rad)).toFixed(2), (100 + radius * Math.sin(rad)).toFixed(2)];
};

test('the needle sits at the exact frequency while the emphasised label only names the nearest anchor', () => {
  const app = createApp();
  try {
    const needle = () => app.document.querySelector('#wheelL .bands .needle');
    app.app.wheelL.setHz(174);
    assert.equal(needle().dataset.angle, (8 * STEP).toFixed(3), 'on the 174 anchor');
    app.app.wheelL.setHz(194.5); // a quarter of the way through the 174 -> 256 sector
    assert.equal(needle().dataset.angle, (8.25 * STEP).toFixed(3));
    assert.deepEqual([...app.document.querySelectorAll('#wheelL .labels span.is-active')].map(s => s.dataset.frequency), ['174']);
    const [x2, y2] = point(79.6, 8.25 * STEP);
    assert.equal(needle().getAttribute('x2'), x2, 'outer end on the tick scale');
    assert.equal(needle().getAttribute('y2'), y2);
    const [x1, y1] = point(46, 8.25 * STEP);
    assert.equal(needle().getAttribute('x1'), x1, 'inner end outside the hub');
    assert.equal(needle().getAttribute('y1'), y1);
    app.app.wheelL.setHz(4200);
    assert.equal(needle().dataset.angle, '359.999', 'a full turn stays just short of 12 o\'clock');
    app.app.wheelL.setHz(0);
    assert.equal(needle().dataset.angle, '0.000');
  } finally { app.close(); }
});

test('the note ring draws the range of the piano note under the pointer', () => {
  const app = createApp();
  try {
    const arc = () => app.document.querySelector('#wheelL .bands .note-range');
    app.app.wheelL.setHz(444); // inside A4: 440 -> 466.16, in the 426 -> 480 sector (index 17)
    assert.equal(arc().dataset.midi, '69');
    const a1 = angleOf(440, 426, 480, 17), a2 = angleOf(midiToHz(70), 426, 480, 17);
    const [x1, y1] = point(73.2, a1), [x2, y2] = point(73.2, a2);
    assert.equal(arc().getAttribute('d'), `M ${x1} ${y1} A 73.2 73.2 0 0 1 ${x2} ${y2}`);
    assert.notEqual(arc().style.stroke, '', 'coloured like the wheel');
    app.app.wheelL.setHz(8); // below A0: no note, no arc
    assert.equal(arc().getAttribute('d'), '');
    assert.equal(arc().dataset.midi, undefined);
    app.app.wheelL.setHz(4200); // C8 is the last key; its range is cut at the wheel's end
    assert.equal(arc().dataset.midi, '108');
    assert.ok(arc().getAttribute('d').startsWith('M '));
    // the ring survives a relayout
    app.window.dispatchEvent(new app.window.Event('resize'));
    assert.equal(arc().dataset.midi, '108');
    assert.equal(app.document.querySelector('#wheelL .bands .needle').dataset.angle, '359.999');
  } finally { app.close(); }
});

test('note ticks mark the key boundaries where a sector gives them room', () => {
  const app = createApp(); // 400 px wheel: 2 px per viewBox unit
  try {
    const ticks = () => [...app.document.querySelectorAll('#wheelL .bands .note-tick')].map(t => t.dataset.hz);
    const all = ticks();
    assert.ok(all.includes('440.00'), 'A4');
    assert.ok(all.includes('41.20'), 'E1, in the 40 -> 62 sector');
    assert.ok(all.includes('4186.01'), 'C8');
    assert.ok(!all.includes('27.50'), 'A0 sits in the 12 -> 40 sector, too dense to draw');
    assert.ok(!all.includes('65.41') && !all.includes('130.81'), 'the 62 -> 136 sector packs 13 semitones into one sector');
    assert.ok(all.every(hz => Number(hz) >= 27.5), 'nothing below the keyboard');
    assert.ok(all.length > 50 && all.length < 89, `${all.length} ticks`);
    assert.equal(app.document.querySelectorAll('#wheelL .bands .tick-major').length, 34, 'the anchor ticks are untouched');
    // a tick spans the note ring at its boundary's angle
    const a4 = app.document.querySelector('#wheelL .bands .note-tick[data-hz="440.00"]');
    const angle = angleOf(440, 426, 480, 17);
    const [x1, y1] = point(72.3, angle), [x2, y2] = point(74.1, angle);
    assert.deepEqual([a4.getAttribute('x1'), a4.getAttribute('y1'), a4.getAttribute('x2'), a4.getAttribute('y2')], [x1, y1, x2, y2]);
  } finally { app.close(); }
});

test('the readouts show the note range and the cents between the wheels', async () => {
  const app = createApp();
  try {
    const range = id => app.document.getElementById(id);
    const text = id => [...range(id).children].map(s => s.textContent);
    app.app.wheelL.setHz(444);
    app.app.wheelR.setHz(880);
    await app.tick(100);
    assert.deepEqual(text('leftWheelRange'), ['A4', '440.00–466.16 Hz', '26.16 Hz · 100 ¢']);
    assert.deepEqual(text('rightWheelRange'), ['A5', '880.00–932.33 Hz', '52.33 Hz · 100 ¢'], 'the Hz width doubles an octave up');
    assert.equal(app.document.getElementById('frequencyDiff').textContent, '436.000 Hz');
    assert.equal(app.document.getElementById('frequencyDiffCents').textContent, '1184 ¢');
    app.app.wheelR.setHz(880 / 2 ** (1 / 12)); // a semitone under 880 = 830.61 Hz, G#5
    await app.tick(100);
    assert.equal(text('rightWheelRange')[0], 'G#5');
    app.click('#noteSystemToggle');
    await app.tick(100);
    assert.equal(text('leftWheelRange')[0], 'La4');
    assert.equal(text('rightWheelRange')[0], 'Sol#5');
    app.click('#noteSystemToggle');
    await app.tick(100);
    app.app.wheelL.setHz(8);
    await app.tick(100);
    assert.equal(range('leftWheelRange').textContent, 'below the piano (A0 starts at 27.50 Hz)');
    assert.ok(range('leftWheelRange').classList.contains('is-empty'));
    app.app.wheelL.setHz(0);
    await app.tick(100);
    assert.equal(range('leftWheelRange').textContent, '—');
    assert.equal(app.document.getElementById('frequencyDiffCents').textContent, '—');
    app.app.wheelL.setHz(4190);
    await app.tick(100);
    assert.equal(text('leftWheelRange')[0], 'C8', 'the top key still has a range');
  } finally { app.close(); }
});
