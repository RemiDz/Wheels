const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const bandText = (app, id) => app.document.querySelector(`#${id} .hub .band-name`).textContent;

test('each wheel draws one arc per band with its name along the arc', () => {
  const app = createApp();
  try {
    for (const id of ['wheelL', 'wheelR']) {
      const arcs = [...app.document.querySelectorAll(`#${id} .bands path.band`)];
      assert.equal(arcs.length, 7, `${id} arcs`);
      assert.ok(arcs.every(arc => /^M [\d.]+ [\d.]+ A 91 91 0 [01] 1 [\d.]+ [\d.]+$/.test(arc.getAttribute('d'))), 'arc path shape');
      // the harness lays the wheel out 400 px wide: the short Alpha and Beta arcs fall back to Greek letters
      const names = [...app.document.querySelectorAll(`#${id} .bands textPath`)].map(t => t.textContent);
      assert.deepEqual(names, ['DELTA', 'THETA', 'α', 'β', 'GAMMA', 'TONES', 'HIGH']);
      const ids = [...app.document.querySelectorAll(`#${id} .bands defs path`)].map(p => p.id);
      assert.ok(ids.every(pathId => pathId.startsWith(`${id}-band-`)), 'text path ids are per wheel');
    }
  } finally { app.close(); }
});

test('the hub names the band under the pointer and keeps the three-decimal value', () => {
  const app = createApp();
  try {
    const cases = [[0.1, 'DELTA'], [3, 'DELTA'], [4, 'THETA'], [7.83, 'THETA'], [8, 'ALPHA'], [12, 'ALPHA'], [13, 'BETA'], [40, 'GAMMA'], [100, 'TONES'], [174, 'TONES'], [963, 'TONES'], [1000, 'HIGH'], [4200, 'HIGH']];
    for (const [hz, band] of cases) {
      app.app.wheelL.setHz(hz);
      assert.equal(bandText(app, 'wheelL'), band, `${hz} Hz`);
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
