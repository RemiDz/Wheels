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
      assert.equal(app.document.querySelectorAll(`#${id} .bands path.hearing`).length, 4, 'hearing ring arcs, each broken under its label');
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

test('a tick scale sits inside the hearing ring: one major tick per anchor label, three minors per sector', () => {
  const app = createApp();
  try {
    const majors = [...app.document.querySelectorAll('#wheelL .bands .tick-major')];
    const minors = [...app.document.querySelectorAll('#wheelL .bands .tick-minor')];
    const labels = [...app.document.querySelectorAll('#wheelL .labels span')];
    assert.equal(majors.length, labels.length, 'one major tick per label');
    assert.equal(minors.length, labels.length * 3, 'three minor ticks per sector');
    assert.equal(app.document.querySelectorAll('#wheelL .bands .tick-mid').length, labels.length, 'the middle minor is longer');
    // the first major tick points straight up at 12 o'clock, between the labels and the hearing ring
    assert.equal(majors[0].getAttribute('x1'), '100.00');
    assert.equal(majors[0].getAttribute('y1'), '24.80');
    assert.equal(majors[0].getAttribute('y2'), '20.40');
    // each major tick shares its angle with its label (label radius 0.34 of the 400 px harness wheel)
    labels.forEach((label, i) => {
      const dx = parseFloat(label.style.left) - 200, dy = parseFloat(label.style.top) - 200;
      const tx = parseFloat(majors[i].getAttribute('x2')) - 100, ty = parseFloat(majors[i].getAttribute('y2')) - 100;
      assert.ok(Math.abs(Math.atan2(dy, dx) - Math.atan2(ty, tx)) < 0.01, `tick ${i} angle`);
    });
    // the emphasised label's tick is emphasised too
    const activeTick = () => [...app.document.querySelectorAll('#wheelL .bands .tick-major.is-active')].map(t => t.dataset.index);
    assert.deepEqual(activeTick(), ['0']);
    app.app.wheelL.setHz(174);
    assert.deepEqual(activeTick(), [String(labels.findIndex(l => l.dataset.frequency === '174'))]);
  } finally { app.close(); }
});

test('label size follows the wheel and alternate labels step inward on small wheels', () => {
  const app = createApp();
  try {
    const wheel = app.document.querySelector('#wheelL');
    const labels = () => [...wheel.querySelectorAll('.labels span')];
    const radius = el => Math.hypot(parseFloat(el.style.left) - 200, parseFloat(el.style.top) - 200);
    assert.equal(wheel.style.getPropertyValue('--wheel-px'), '400px');
    assert.equal(wheel.querySelector('.labels').classList.contains('is-staggered'), false, 'a 400 px wheel has room');
    assert.ok(labels().every(l => Math.abs(radius(l) - 136) < 0.01), 'all labels at 0.34 of the width');
    // shrink to an iPad-portrait wheel: neighbouring three-digit labels would touch
    app.window.HTMLElement.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 280, bottom: 280, width: 280, height: 280 });
    app.window.dispatchEvent(new app.window.Event('resize'));
    assert.equal(wheel.style.getPropertyValue('--wheel-px'), '280px');
    assert.equal(wheel.querySelector('.labels').classList.contains('is-staggered'), true);
    const small = labels().map(l => Math.hypot(parseFloat(l.style.left) - 140, parseFloat(l.style.top) - 140));
    small.forEach((r, i) => assert.ok(Math.abs(r - (i % 2 ? 81.2 : 95.2)) < 0.01, `label ${i} radius ${r}`));
    assert.equal(wheel.querySelectorAll('.bands .tick-major').length, labels().length, 'ticks redrawn');
  } finally { app.close(); }
});
