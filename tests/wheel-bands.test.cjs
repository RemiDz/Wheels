const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const bandText = (app, id) => app.document.querySelector(`#${id} .hub .band-name`).textContent;

test('each wheel draws one arc per band with its name along the arc', () => {
  const app = createApp();
  try {
    for (const id of ['wheelL', 'wheelR']) {
      const arcs = [...app.document.querySelectorAll(`#${id} .bands path.band`)];
      assert.equal(arcs.length, 8, `${id} arcs`);
      assert.ok(arcs.every(arc => /^M [\d.]+ [\d.]+ A 92 92 0 [01] 1 [\d.]+ [\d.]+$/.test(arc.getAttribute('d'))), 'arc path shape');
      assert.equal(app.document.querySelectorAll(`#${id} .bands path.band-accent`).length, 8);
      assert.equal(app.document.querySelectorAll(`#${id} .bands path.hearing`).length, 2, 'hearing ring arcs');
      // the harness lays the wheel out 400 px wide: the short Alpha and Beta arcs fall back to Greek letters
      const names = [...app.document.querySelectorAll(`#${id} .bands .band-label textPath`)].map(t => t.textContent);
      assert.deepEqual(names, ['DELTA', 'THETA', 'α', 'β', 'GAMMA', 'LOW', 'MID', 'HIGH']);
      const hearing = [...app.document.querySelectorAll(`#${id} .bands .hearing-label textPath`)].map(t => t.textContent);
      assert.deepEqual(hearing, ['INFRASOUND', 'AUDIBLE RANGE']);
      const ids = [...app.document.querySelectorAll(`#${id} .bands defs path`)].map(p => p.id);
      assert.ok(ids.every(pathId => pathId.startsWith(`${id}-band-`)), 'text path ids are per wheel');
    }
  } finally { app.close(); }
});

test('the hub names the band under the pointer and keeps the three-decimal value', () => {
  const app = createApp();
  try {
    const cases = [[0.1, 'DELTA', '0.1–4 Hz'], [3, 'DELTA', '0.1–4 Hz'], [4, 'THETA', '4–8 Hz'], [7.83, 'THETA', '4–8 Hz'], [8, 'ALPHA', '8–13 Hz'], [12, 'ALPHA', '8–13 Hz'], [13, 'BETA', '13–30 Hz'], [40, 'GAMMA', '30–100 Hz'], [100, 'LOW', '100–250 Hz'], [174, 'LOW', '100–250 Hz'], [250, 'MID', '250–1000 Hz'], [963, 'MID', '250–1000 Hz'], [1000, 'HIGH', '1000–4200 Hz'], [4200, 'HIGH', '1000–4200 Hz']];
    for (const [hz, band, range] of cases) {
      app.app.wheelL.setHz(hz);
      assert.equal(bandText(app, 'wheelL'), band, `${hz} Hz`);
      assert.equal(app.document.querySelector('#wheelL .hub .band-range').textContent, range, `${hz} Hz range`);
    }
    assert.equal(app.document.querySelector('#wheelL .hub .hz').textContent, '4200.000');
    assert.equal(app.document.querySelector('#wheelL .hub .sub').textContent, 'Hz');
    assert.notEqual(app.document.querySelector('#wheelL .hub .band-name').style.color, '');
  } finally { app.close(); }
});

test('the anchor label nearest the pointer is emphasised', () => {
  const app = createApp();
  try {
    const active = () => [...app.document.querySelectorAll('#wheelL .labels span.is-active')].map(s => s.dataset.frequency);
    assert.deepEqual(active(), ['0.1']);
    app.app.wheelL.setHz(174);
    assert.deepEqual(active(), ['174']);
    app.app.wheelL.setHz(180); // 174 -> 256 sector, still nearer the 174 label
    assert.deepEqual(active(), ['174']);
    app.app.wheelL.setHz(250);
    assert.deepEqual(active(), ['256']);
    app.app.wheelL.setHz(4200);
    assert.deepEqual(active(), ['0.1'], 'a full turn is nearest the first label again');
  } finally { app.close(); }
});
