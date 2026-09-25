const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const lastEvent = param => param.events[param.events.length - 1];

test('Pause fades the voices to silence before the context suspends, and Play brings them back', async () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(174); app.app.wheelR.setHz(285);
    app.click('#play'); await app.tick(300);
    const { wheel1, wheel2, monoOsc1, audioCtx } = app.app.state;
    app.click('#pause');
    // the fade is scheduled at once; the suspension waits for it
    for (const gain of [wheel1.gain.gain, wheel2.gain.gain, monoOsc1._gain.gain]) {
      const last = lastEvent(gain);
      assert.equal(last.type, 'linear');
      assert.equal(last.value, 0);
      assert.ok(last.time - audioCtx.currentTime <= 0.031, 'fade longer than the release');
    }
    assert.equal(audioCtx.state, 'running', 'suspended before the fade could render');
    await app.tick(120);
    assert.equal(audioCtx.state, 'suspended');
    assert.equal(app.document.getElementById('pause').classList.contains('is-active'), true);

    app.click('#play'); await app.tick(100);
    assert.equal(audioCtx.state, 'running');
    assert.equal(lastEvent(wheel1.gain.gain).value, 0.25);
    assert.equal(lastEvent(monoOsc1._gain.gain).value, 0.125);
    assert.ok(wheel1.osc.running, 'the same voices continue after Pause/Play');
  } finally { app.close(); }
});

test('Play during the pause fade wins: nothing is suspended and the voices ramp back up', async () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(174); app.app.wheelR.setHz(285);
    app.click('#play'); await app.tick(300);
    const { wheel1, audioCtx } = app.app.state;
    app.click('#pause'); await app.tick(20);
    app.click('#play'); await app.tick(200);
    assert.equal(audioCtx.state, 'running');
    assert.equal(lastEvent(wheel1.gain.gain).value, 0.25);
    assert.equal(app.document.getElementById('play').classList.contains('is-active'), true);
    assert.equal(app.document.getElementById('pause').classList.contains('is-active'), false);
  } finally { app.close(); }
});

test('Pause with Play Overtones on fades the harmonics and Play restores their levels', async () => {
  const app = createApp();
  try {
    app.app.generateOvertones(220);
    app.click('#play'); await app.tick(100);
    app.click('#overtoneHighlightToggle'); await app.tick(5500);
    const harmonics = app.app.state.harmonicOscillators.filter(h => h.started);
    const before = harmonics[0].gain.gain.value;
    assert.ok(before > 0);
    app.click('#pause');
    assert.equal(lastEvent(harmonics[0].gain.gain).value, 0);
    await app.tick(120);
    assert.equal(app.app.state.audioCtx.state, 'suspended');
    app.click('#play'); await app.tick(100);
    assert.equal(lastEvent(harmonics[0].gain.gain).value, before);
  } finally { app.close(); }
});
