const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const fineTuneText = app => app.document.getElementById('fineTuneValue').textContent;
const pitchBendText = app => app.document.getElementById('pitchBendValue').textContent;
const pair = app => [app.app.wheelL.getHz(), app.app.wheelR.getHz()].map(v => Number(v.toFixed(6)));

test('fine tune and pitch bend offsets reset when the wheels move another way', async () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(174); app.app.wheelR.setHz(174);
    app.app.applyFineTune(1); app.app.applyPitchBend(2);
    assert.deepEqual(pair(app), [177, 177]);
    assert.equal(fineTuneText(app), '+3.000 Hz');
    assert.equal(pitchBendText(app), '+3.000');

    app.key('#wheelL', 'ArrowUp'); // any other change makes the current pair the new base
    await app.tick(50);
    assert.equal(fineTuneText(app), '+0.000 Hz');
    assert.equal(pitchBendText(app), '+0.000');
    const before = pair(app);
    app.key('#pitchBendWheel', 'Home');
    await app.tick(50);
    assert.deepEqual(pair(app), before, 'Home moved the wheels by a stale offset');

    app.app.applyFineTune(1.5);
    app.select('#presetSelect', '2');
    assert.equal(fineTuneText(app), '+0.000 Hz');
    assert.deepEqual(pair(app), [136.1, 204.15]);
  } finally { app.close(); }
});

test('pitch bend Home returns to the base pair after bends in both directions', () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(200); app.app.wheelR.setHz(210);
    app.key('#pitchBendWheel', 'ArrowUp'); app.key('#pitchBendWheel', 'ArrowUp'); app.key('#pitchBendWheel', 'ArrowDown');
    assert.deepEqual(pair(app), [200.1, 210.1]);
    app.key('#pitchBendWheel', 'Home');
    assert.deepEqual(pair(app), [200, 210]);
    assert.equal(pitchBendText(app), '+0.000');
    assert.equal(fineTuneText(app), '+0.000 Hz');
  } finally { app.close(); }
});

test('the fine tune rotor only turns by the amount actually applied at the 0 Hz floor', () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(0.1); app.app.wheelR.setHz(0.1);
    for (let i = 0; i < 5; i++) app.key('#fineTuneDial', 'ArrowDown');
    assert.equal(fineTuneText(app), '-0.100 Hz');
    const pointer = app.document.querySelector('#fineTuneDial .fine-tune-pointer');
    assert.match(pointer.style.transform, /rotate\(-3\.6deg\)/);
    assert.deepEqual(pair(app), [0, 0]);
  } finally { app.close(); }
});
