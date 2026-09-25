const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

test('Play Overtones with no piano key uses the left wheel as the fundamental', async () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(396); app.app.wheelR.setHz(528);
    app.click('#play'); await app.tick(100);
    app.click('#overtoneHighlightToggle'); await app.tick(5500);
    assert.equal(app.app.state.currentOvertonesFundamental, 396);
    const running = app.app.state.harmonicOscillators.filter(h => h.started);
    assert.equal(running.length, 16);
    assert.equal(running[0].osc.frequency.value, 396);
    assert.equal(running[1].osc.frequency.value, 792);
    assert.ok(running[0].gain.gain.value > 0, 'the fundamental is audible');
  } finally { app.close(); }
});

test('the left wheel moves the overtone fundamental while Play Overtones is on', async () => {
  const app = createApp();
  try {
    app.app.generateOvertones(220);
    app.click('#play'); await app.tick(100);
    app.click('#overtoneHighlightToggle'); await app.tick(5500);
    app.app.wheelL.setHz(300); await app.tick(500);
    assert.equal(app.app.state.currentOvertonesFundamental, 300);
    const third = app.app.state.harmonicOscillators[2];
    assert.equal(third.osc.frequency.value, 900);
    assert.equal(app.document.querySelector('[data-harmonic="1"] .overtone-frequency').textContent, '300.0 Hz');
  } finally { app.close(); }
});

test('the default overtone level matches a wheel voice and the stack keeps headroom', async () => {
  const app = createApp();
  try {
    app.app.generateOvertones(110);
    app.click('#overtoneHighlightToggle'); await app.tick(5500);
    const harmonics = app.app.state.harmonicOscillators;
    assert.ok(Math.abs(harmonics[0].gain.gain.value - 0.23) < 1e-9, `fundamental gain ${harmonics[0].gain.gain.value}`);
    assert.ok(Math.abs(harmonics[1].gain.gain.value - 0.115) < 1e-9);
    assert.ok(harmonics.reduce((sum, h) => sum + h.gain.gain.value, 0) <= 0.8);
  } finally { app.close(); }
});

test('the overtones demo restores Play Overtones mode when it ends', async () => {
  const app = createApp();
  try {
    app.app.generateOvertones(220);
    app.click('#play'); await app.tick(100);
    app.click('#overtoneHighlightToggle'); await app.tick(500);
    assert.equal(app.app.state.showOvertoneHighlights, true);
    app.app.startOvertonesDemo();
    await app.tick(110000);
    assert.equal(app.app.state.overtonesDemoRunning, false);
    assert.equal(app.app.state.showOvertoneHighlights, true);
    assert.equal(app.document.getElementById('overtoneHighlightToggle').classList.contains('is-active'), true);
    assert.deepEqual([app.app.state.wheelLMuted, app.app.state.wheelRMuted], [true, true]);
    app.click('#play'); await app.tick(5500);
    assert.equal(app.app.state.harmonicsPlaying, true);
    assert.equal(app.app.state.currentOvertonesFundamental, 220);
  } finally { app.close(); }
});

test('the overtones demo completes without animation frames (hidden tab)', async () => {
  const app = createApp();
  try {
    app.window.requestAnimationFrame = () => 0;
    app.window.cancelAnimationFrame = () => {};
    app.app.startOvertonesDemo();
    await app.tick(110000);
    assert.equal(app.app.state.overtonesDemoRunning, false);
    assert.equal(app.app.state.audioCtx.oscillators.filter(o => o.running).length, 0);
  } finally { app.close(); }
});
