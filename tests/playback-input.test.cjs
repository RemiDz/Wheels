const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

function setup(t, options) {
  const env = createApp(options);
  t.after(() => env.close());
  return env;
}

for (const [name, start] of [
  ['guided journey', env => env.app.startProgram(Object.keys(env.app.RELAXATION_PROGRAMS)[0])],
  ['dynamic journey', env => env.app.startDynamicJourney(Object.keys(env.app.DYNAMIC_JOURNEYS)[0])],
  ['overtone demo', env => env.app.startOvertonesDemo()],
  ['main demo', env => env.app.startDemo()],
  ['theory demo', env => env.app.startTheoryDemo()],
  ['Quick Start', env => env.app.startQuickStart('focus')],
  ['manual playback', env => env.click('#play')],
  ['harmonics', env => { env.app.generateOvertones(220); env.click('#overtoneHighlightToggle'); }],
  ['music lesson', env => { env.select('#conceptSelect', 'tone'); env.click('#explanationDemo .demo-btn'); }],
]) {
  test(`Pause stays effective while ${name} is activating audio`, async t => {
    const env = setup(t, { delayedResume: true });
    const pending = start(env);
    env.click('#pause');
    await env.tick(300); await pending;
    assert.equal(env.app.state.audioCtx.state, 'suspended');
    assert.equal(env.document.querySelector('#pause').classList.contains('is-active'), true);
    assert.equal(env.document.querySelector('#play').classList.contains('is-active'), false);
    const time = env.app.playback.now();
    const hz = env.app.wheelL.getHz();
    await env.tick(1000);
    assert.equal(env.app.playback.now(), time);
    assert.equal(env.app.wheelL.getHz(), hz);
    env.click('#play'); await env.tick(300);
    assert.equal(env.app.state.audioCtx.state, 'running');
    assert.equal(env.document.querySelector('#play').classList.contains('is-active'), true);
    env.click('#stop'); await env.tick(500);
    assert.equal(env.app.state.audioCtx.oscillators.filter(osc => osc.running).length, 0);
  });
}

for (const [name, resume] of [
  ['Play', env => env.click('#play')],
  ['piano', env => env.key('[data-note="A4"]', 'Enter')],
  ['preset', env => env.select('#binauralPresetSelect', 'alpha10')],
  ['Quick Start', env => env.app.startQuickStart('focus')],
]) {
  test(`${name} resumes audio even when an earlier Pause is still pending`, async t => {
    const env = setup(t, { delayedSuspend: true });
    env.click('#play'); await env.tick(100);
    env.click('#pause'); resume(env); await env.tick(300);
    assert.equal(env.app.state.audioCtx.state, 'running');
    assert.equal(env.app.playback.pausedAt, null);
    assert.equal(env.document.querySelector('#play').classList.contains('is-active'), true);
  });
}

test('an old audio activation failure cannot stop a newer session', async t => {
  const env = setup(t);
  const resume = env.window.AudioContext.prototype.resume;
  let calls = 0;
  env.window.AudioContext.prototype.resume = function () {
    if (++calls === 1) return new Promise((resolve, reject) => env.window.setTimeout(() => reject(new Error('Old activation failed')), 150));
    return resume.call(this);
  };
  env.click('#play'); env.app.startQuickStart('focus'); await env.tick(500);
  assert.equal(env.app.state.quickStartRunning, true);
  assert.equal(env.document.querySelector('#audioStatus').hidden, true);
  assert.equal(env.app.state.audioCtx.state, 'running');
});

test('a failed attempt to restore the latest transport state shows a retry message', async t => {
  const env = setup(t, { delayedSuspend: true });
  env.click('#play'); await env.tick(100);
  const ctx = env.app.state.audioCtx;
  const resume = ctx.resume.bind(ctx);
  let calls = 0;
  ctx.resume = () => ++calls === 1 ? resume() : Promise.reject(new Error('Audio device unavailable'));
  env.click('#pause'); env.click('#play'); await env.tick(300);
  assert.equal(env.document.querySelector('#audioStatus').hidden, false);
  assert.equal(env.document.querySelector('#play').classList.contains('is-active'), false);
  assert.equal(ctx.oscillators.filter(osc => osc.running).length, 0);
});

test('a piano key can resume an interrupted audio context', async t => {
  const env = setup(t);
  env.click('#play'); await env.tick(100);
  env.app.state.audioCtx.state = 'interrupted';
  env.key('[data-note="A4"]', 'Enter'); await env.tick(100);
  assert.equal(env.app.state.audioCtx.state, 'running');
  assert.equal(env.app.state.wheel1.osc.frequency.value, 440);
});

test('piano scrolling takes control from a running sequence and starts the selected tone', async t => {
  const env = setup(t);
  env.key('[data-note="A4"]', 'Enter'); await env.tick(200);
  env.app.startQuickStart('focus'); await env.tick(200);
  env.document.querySelector('[data-note="A4"]').dispatchEvent(new env.window.WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true }));
  const hz = env.app.wheelL.getHz();
  await env.tick(1000);
  assert.equal(env.app.state.quickStartRunning, false);
  assert.equal(env.app.wheelL.getHz(), hz);
  assert.ok(env.app.state.wheel1.osc.running);
  assert.equal(env.app.state.wheel1.osc.frequency.value, hz);
  assert.equal(env.app.state.audioCtx.state, 'running');
});

for (const replay of [false, true]) {
  test(`leaving ${replay ? 'replayed' : 'standalone'} overtones restores audible wheel playback`, async t => {
    const env = setup(t);
    env.key('[data-note="A4"]', 'Enter'); await env.tick(100);
    env.click('#stop'); env.click('#overtoneHighlightToggle'); await env.tick(100);
    if (replay) { env.click('#stop'); env.click('#overtonesReplay'); await env.tick(100); }
    env.click('#overtoneHighlightToggle'); await env.tick(200);
    assert.equal(env.app.state.harmonicsPlaying, false);
    assert.ok(env.app.state.wheel1.osc.running);
    assert.equal(env.app.state.wheel1.gain.gain.value, 0.25);
    assert.equal(env.app.state.audioCtx.state, 'running');
    assert.equal(env.document.querySelector('#play').classList.contains('is-active'), true);
  });
}

for (const transport of ['stop', 'pause']) {
  test(`disabling overtones after ${transport} preserves the transport state`, async t => {
    const env = setup(t);
    env.key('[data-note="A4"]', 'Enter'); env.click('#overtoneHighlightToggle'); await env.tick(100);
    env.click('#' + transport); await env.tick(100);
    env.click('#overtoneHighlightToggle'); await env.tick(100);
    assert.equal(env.document.querySelector('#play').classList.contains('is-active'), false);
    if (transport === 'pause') {
      assert.equal(env.app.state.audioCtx.state, 'suspended');
      assert.notEqual(env.app.playback.pausedAt, null);
    } else {
      assert.equal(env.app.state.audioCtx.oscillators.filter(osc => osc.running).length, 0);
    }
  });
}

test('muted harmonic indicators stay correct when a new piano note rebuilds the cards', async t => {
  const env = setup(t);
  env.key('[data-note="A4"]', 'Enter'); env.click('#overtoneHighlightToggle'); await env.tick(100);
  env.click('[data-harmonic="1"] .overtone-content');
  env.key('[data-note="A3"]', 'Enter'); await env.tick(200);
  assert.equal(env.app.state.harmonicMutedState[0], true);
  assert.equal(env.document.querySelector('[data-harmonic="1"] .overtone-mute-indicator').textContent, '🔇');
  assert.equal(env.app.state.harmonicOscillators[0].gain.gain.value, 0);
});
