const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

function setup(t, options) { const env = createApp(options); t.after(() => env.close()); return env; }
function noSound(env) {
  const ctx = env.app.state.audioCtx;
  assert.equal(ctx?.oscillators.filter(osc => osc.running).length ?? 0, 0, 'No oscillator may keep running after Stop');
}

test('initializes all controls even when browser storage is blocked', t => {
  const env = setup(t, { blockedStorage: true });
  assert.deepEqual(env.errors, []);
  env.click('#themeToggle');
  assert.ok(env.app);
  assert.equal(env.document.querySelectorAll('.piano-key').length, 88);
});

for (const [name, start] of [
  ['guided', env => env.app.startProgram(Object.keys(env.app.RELAXATION_PROGRAMS)[0])],
  ['dynamic', env => env.app.startDynamicJourney(Object.keys(env.app.DYNAMIC_JOURNEYS)[0])],
  ['quick start', env => env.app.startQuickStart('focus')],
  ['main demo', env => env.app.startDemo()],
  ['overtones demo', env => env.app.startOvertonesDemo()],
  ['theory demo', env => env.app.startTheoryDemo()],
]) {
  test(`Stop cancels ${name} audio and future callbacks`, async t => {
    const env = setup(t); await start(env); await env.tick(800);
    env.click('#stop'); await env.tick(12000); noSound(env);
    for (const key of ['programRunning', 'dynamicJourneyRunning', 'quickStartRunning', 'demoRunning', 'overtonesDemoRunning', 'theoryDemoRunning']) assert.equal(env.app.state[key], false, key);
  });
  test(`Pause freezes ${name} and Play resumes without advancing its clock`, async t => {
    const env = setup(t); await start(env); await env.tick(800);
    env.click('#pause'); await env.tick(20);
    const hz = env.app.wheelL.getHz();
    const oscillatorCount = env.app.state.audioCtx.oscillators.length;
    await env.tick(5000);
    assert.equal(env.app.state.audioCtx.state, 'suspended');
    assert.equal(env.app.wheelL.getHz(), hz);
    assert.equal(env.app.state.audioCtx.oscillators.length, oscillatorCount);
    env.click('#play'); await env.tick(100);
    assert.equal(env.app.state.audioCtx.state, 'running');
    env.click('#stop'); await env.tick(1000); noSound(env);
  });
}

test('switching from guided to dynamic cannot stop the new session after a fade', async t => {
  const env = setup(t);
  await env.app.startProgram(Object.keys(env.app.RELAXATION_PROGRAMS)[0]);
  await env.tick(200);
  await env.app.startDynamicJourney(Object.keys(env.app.DYNAMIC_JOURNEYS)[0]);
  await env.tick(3500);
  assert.equal(env.app.state.dynamicJourneyRunning, true);
  assert.equal(env.app.state.programRunning, false);
  assert.ok(env.app.state.wheel1?.osc.running);
});

for (const topic of ['frequency', 'vibrations', 'harmonics', 'overtones', 'timbre', 'tone', 'note', 'scale', 'octave', 'intervals']) {
  test(`music lesson ${topic} completes without errors and can be stopped early`, async t => {
    const env = setup(t);
    env.select('#conceptSelect', topic); env.click('#explanationDemo .demo-btn');
    await env.tick(9000);
    noSound(env);
    env.click('#explanationDemo .demo-btn'); await env.tick(100);
    env.click('#stop'); noSound(env); await env.tick(9000); noSound(env);
  });
}

test('Play restores harmonics after Stop without unmuting wheel voices', async t => {
  const env = setup(t);
  env.app.wheelL.setHz(220); env.app.wheelR.setHz(220);
  env.app.generateOvertones(220); env.click('#overtoneHighlightToggle'); await env.tick(500);
  env.click('#stop'); env.click('#play'); await env.tick(1000);
  assert.equal(env.app.state.harmonicsPlaying, true);
  assert.equal(env.app.state.wheel1.gain.gain.value, 0);
});

test('does not create audio before a user requests playback', t => {
  const env = setup(t);
  assert.equal(env.app.state.audioCtx, null);
});

test('all 88 keys report their exact note without a floating-point semitone error', t => {
  const env = setup(t);
  for (const key of env.document.querySelectorAll('.piano-key')) {
    const note = env.app.frequencyToNote(Number(key.dataset.frequency));
    assert.equal(note.note, key.dataset.note);
    assert.equal(note.cents, 0);
  }
});

test('pointer drag cannot wrap from maximum to minimum or jump during fine tuning', t => {
  const env = setup(t);
  const pointer = env.document.querySelector('#wheelL .pointer');
  const inner = env.document.querySelector('#wheelL .inner-pointer');
  const point = (target, type, angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    const event = new env.window.MouseEvent(type, { clientX: 200 + 180 * Math.cos(rad), clientY: 200 + 180 * Math.sin(rad), bubbles: true, cancelable: true });
    Object.defineProperty(event, 'pointerId', { value: 1 }); target.dispatchEvent(event);
  };
  env.app.wheelL.setHz(4200);
  point(pointer, 'pointerdown', 0); point(env.window, 'pointermove', 10); point(env.window, 'pointerup', 10);
  assert.equal(env.app.wheelL.getHz(), 4200);
  point(inner, 'pointerdown', 0); point(env.window, 'pointermove', -30); point(env.window, 'pointerup', -30);
  assert.ok(env.app.wheelL.getHz() > 4199.9);
  env.key('#wheelL', 'Home'); assert.equal(env.app.wheelL.getHz(), 0);
  point(inner, 'pointerdown', 0); point(env.window, 'pointermove', -30); point(env.window, 'pointerup', -30);
  assert.equal(env.app.wheelL.getHz(), 0);
});

test('a harmonic progression lands on its final interval without jumping backwards', t => {
  const env = setup(t);
  const last = env.app.getHarmonicFrequencies(100, ['unison', 'fifth', 'octave'], 1, 5);
  assert.equal(last.rightHz, 205);
});

test('every journey duration matches its phases and all modulated frequencies are valid', t => {
  const env = setup(t);
  for (const journey of [...Object.values(env.app.RELAXATION_PROGRAMS), ...Object.values(env.app.DYNAMIC_JOURNEYS)]) {
    assert.equal(journey.duration, journey.phases.reduce((sum, phase) => sum + phase.duration, 0), journey.name);
  }
  for (const journey of Object.values(env.app.DYNAMIC_JOURNEYS)) {
    for (const phase of journey.phases) for (const progress of [0, 0.1, 0.5, 0.999, 1]) {
      const frequencies = env.app.calculateHarmonicFrequencies(phase, phase.duration * progress, phase.duration);
      for (const hz of [frequencies.leftHz, frequencies.rightHz]) assert.ok(hz > 0 && hz <= 4200 && Number.isFinite(hz), journey.name);
    }
  }
});

for (const mode of ['guided', 'dynamic', 'overtones', 'play']) {
  test(`Stop cancels ${mode} while audio resume is still pending`, async t => {
    const env = setup(t, { delayedResume: true });
    let pending;
    if (mode === 'guided') pending = env.app.startProgram(Object.keys(env.app.RELAXATION_PROGRAMS)[0]);
    if (mode === 'dynamic') pending = env.app.startDynamicJourney(Object.keys(env.app.DYNAMIC_JOURNEYS)[0]);
    if (mode === 'overtones') env.app.startOvertonesDemo();
    if (mode === 'play') env.click('#play');
    env.click('#stop'); await env.tick(1500); await pending;
    noSound(env);
    assert.equal(env.document.querySelector('#play').classList.contains('is-active'), false);
  });
}

test('audio activation failure leaves a visible retry message and no active mode', async t => {
  const env = setup(t, { rejectResume: true }); env.click('#play'); await env.tick(100);
  assert.equal(env.document.querySelector('#audioStatus').hidden, false);
  noSound(env);
});

test('manual wheel and preset changes replace an automated session', async t => {
  const env = setup(t);
  env.app.startQuickStart('focus'); await env.tick(200);
  env.select('#binauralPresetSelect', 'alpha10'); await env.tick(1500);
  assert.equal(env.app.state.quickStartRunning, false);
  assert.equal(env.app.wheelL.getHz(), 150); assert.equal(env.app.wheelR.getHz(), 160);
  env.app.startDemo(); await env.tick(200);
  env.key('#wheelL', 'ArrowUp'); const hz = env.app.wheelL.getHz(); await env.tick(1500);
  assert.equal(env.app.state.demoRunning, false); assert.equal(env.app.wheelL.getHz(), hz);
});

test('high harmonics are silent above Nyquist and combined gain reserves headroom', async t => {
  const env = setup(t); env.app.generateOvertones(4200); env.click('#overtoneHighlightToggle'); await env.tick(5000);
  const harmonics = env.app.state.harmonicOscillators;
  assert.ok(harmonics.every(h => h.osc.frequency.value < 24000));
  assert.ok(harmonics.slice(5).every(h => h.gain.gain.value === 0));
  assert.ok(harmonics.reduce((sum, h) => sum + h.gain.gain.value, 0) <= 0.8);
});

test('new guided journey survives cancellation of an earlier fade', async t => {
  const env = setup(t); const id = Object.keys(env.app.RELAXATION_PROGRAMS)[0];
  await env.app.startProgram(id); await env.tick(200);
  const stopping = env.app.stopProgram(); await env.tick(300);
  env.click('#reset'); await stopping;
  await env.app.startProgram(id); await env.tick(3500);
  assert.equal(env.app.state.programRunning, true);
  assert.ok(env.app.state.wheel1?.osc.running);
});

test('piano focus stays on the played key and horizontal scrolling remains available', async t => {
  const env = setup(t); const key = env.document.querySelector('[data-note="A4"]'); key.focus();
  env.key('[data-note="A4"]', 'Enter'); await env.tick(100);
  assert.equal(env.document.activeElement, key);
  env.key('[data-note="A4"]', 'ArrowRight');
  assert.equal(env.document.activeElement.dataset.note, 'A#4');
  const event = new env.window.WheelEvent('wheel', { deltaX: 100, deltaY: 0, bubbles: true, cancelable: true });
  key.dispatchEvent(event); assert.equal(event.defaultPrevented, false);
});

test('harmonic mute during sequence remains muted after its scheduled entrance', async t => {
  const env = setup(t); env.app.generateOvertones(220);
  env.click('#overtoneHighlightToggle');
  env.click('[data-harmonic="4"] .overtone-content'); await env.tick(1300);
  assert.equal(env.app.state.harmonicOscillators[3].gain.gain.value, 0);
});

test('mono mix respects each wheel mute', async t => {
  const env = setup(t); env.click('#play'); await env.tick(100);
  env.click('.mute-btn[data-wheel="wheelL"]');
  assert.equal(env.app.state.monoOsc1._gain.gain.value, 0);
});

test('mono volume works with a keyboard', t => {
  const env = setup(t); env.key('#monoSlider', 'End');
  assert.equal(env.document.querySelector('#monoSlider').getAttribute('aria-valuenow'), '100');
  env.key('#monoSlider', 'Home');
  assert.equal(env.document.querySelector('#monoSlider').getAttribute('aria-valuenow'), '0');
});

test('shared tuning preserves frequency difference at both boundaries', t => {
  const env = setup(t);
  for (const method of ['applyFineTune', 'applyPitchBend']) {
    env.app.wheelL.setHz(4190); env.app.wheelR.setHz(4200); env.app[method](1);
    assert.equal(env.app.wheelR.getHz() - env.app.wheelL.getHz(), 10);
    env.app.wheelL.setHz(0.1); env.app.wheelR.setHz(10.1); env.app[method](-1);
    assert.ok(Math.abs(env.app.wheelR.getHz() - env.app.wheelL.getHz() - 10) < 1e-9);
  }
});

test('Reset clears selections and disables journey Start buttons', async t => {
  const env = setup(t);
  env.select('#programSelect', Object.keys(env.app.RELAXATION_PROGRAMS)[0]);
  env.select('#dynamicJourneySelect', Object.keys(env.app.DYNAMIC_JOURNEYS)[0]);
  env.click('#reset'); await env.tick(200);
  assert.equal(env.document.querySelector('#programStart').disabled, true);
  assert.equal(env.document.querySelector('#dynamicJourneyStart').disabled, true);
  noSound(env);
});

for (const [name, start] of [
  ['main demo', env => env.app.startDemo()],
  ['overtones demo', env => env.app.startOvertonesDemo()],
  ['theory demo', env => env.app.startTheoryDemo()],
  ['guided journey', env => env.app.startProgram(Object.keys(env.app.RELAXATION_PROGRAMS)[0])],
  ['dynamic journey', env => env.app.startDynamicJourney(Object.keys(env.app.DYNAMIC_JOURNEYS)[0])],
]) {
  test(`${name} completes naturally without lingering audio or active transport`, async t => {
    const env = setup(t, { frameMs: 5000 }); await start(env); await env.tick(2000000);
    noSound(env);
    assert.equal(env.document.querySelector('#play').classList.contains('is-active'), false);
    env.click('#play'); await env.tick(200);
    assert.ok(env.app.state.wheel1?.osc.running, 'Play must work after completion');
  });
}

test('all Quick Start buttons point to valid presets and switching leaves one session', async t => {
  const env = setup(t);
  for (const button of env.document.querySelectorAll('.quick-start-btn')) {
    assert.ok(env.app.QUICK_START_PRESETS[button.dataset.preset], button.dataset.preset);
    button.click(); await env.tick(100);
    assert.equal(env.document.querySelectorAll('.quick-start-btn.is-playing').length, 1);
    assert.equal(env.app.state.programRunning, false); assert.equal(env.app.state.dynamicJourneyRunning, false);
  }
  env.click('#stop'); noSound(env);
});

test('switching among every playback mode leaves no old session or orphan oscillator', async t => {
  const env = setup(t);
  for (let i = 0; i < 2; i++) {
    env.app.startTheoryDemo(); await env.tick(4000);
    env.app.startQuickStart('focus'); await env.tick(200);
    assert.equal(env.app.state.theoryDemoRunning, false);
    await env.app.startProgram(Object.keys(env.app.RELAXATION_PROGRAMS)[0]); await env.tick(200);
    assert.equal(env.app.state.quickStartRunning, false);
    env.app.startOvertonesDemo(); await env.tick(4000);
    assert.equal(env.app.state.programRunning, false);
    await env.app.startDynamicJourney(Object.keys(env.app.DYNAMIC_JOURNEYS)[0]); await env.tick(200);
    assert.equal(env.app.state.overtonesDemoRunning, false);
    env.app.startDemo(); await env.tick(200);
    assert.equal(env.app.state.dynamicJourneyRunning, false);
  }
  env.click('#stop'); noSound(env); await env.tick(12000); noSound(env);
});

test('harmonic volume and mute are usable without mouse-wheel input', async t => {
  const env = setup(t); env.app.generateOvertones(220); env.click('#overtoneHighlightToggle'); await env.tick(200);
  const slider = env.document.querySelector('[data-harmonic="1"] .overtone-volume-slider');
  slider.value = '80'; slider.dispatchEvent(new env.window.Event('input', { bubbles: true }));
  assert.equal(env.document.querySelector('[data-harmonic="1"] .overtone-volume-label').textContent, '80%');
  assert.ok(Math.abs(env.app.state.harmonicOscillators[0].gain.gain.value - 0.04) < 1e-9);
  env.key('[data-harmonic="1"] .overtone-content', 'Enter');
  assert.equal(env.app.state.harmonicOscillators[0].gain.gain.value, 0);
  assert.equal(env.document.querySelector('[data-harmonic="1"] .overtone-content').getAttribute('aria-pressed'), 'true');
});

test('Pause preserves journey elapsed time and its remaining phase', async t => {
  const env = setup(t);
  await env.app.startProgram(Object.keys(env.app.RELAXATION_PROGRAMS)[0]); await env.tick(2300);
  env.click('#pause'); await env.tick(100);
  const elapsed = env.document.querySelector('#programElapsed').textContent;
  await env.tick(12000); assert.equal(env.document.querySelector('#programElapsed').textContent, elapsed);
  env.click('#play'); await env.tick(1100);
  assert.equal(env.document.querySelector('#programElapsed').textContent, '00:03');
});

test('overtone rendering recovers when a mode changes before its queued frame', async t => {
  const env = setup(t);
  env.app.generateOvertones(220); env.click('#overtoneHighlightToggle');
  env.app.startDemo(); env.click('#stop');
  env.app.generateOvertones(220); env.click('#overtoneHighlightToggle'); await env.tick(400);
  assert.ok(env.document.querySelectorAll('.piano-key.is-overtone').length > 0);
});
