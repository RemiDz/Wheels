const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

// A hidden page gets no animation frames at all; timers keep running.
function hidePage(app) {
  Object.defineProperty(app.document, 'visibilityState', { value: 'hidden', configurable: true });
  app.window.requestAnimationFrame = () => 0;
  app.window.cancelAnimationFrame = () => {};
  app.document.dispatchEvent(new app.window.Event('visibilitychange'));
}

// Simulated frames cost real DOM work, so long sessions run on coarse frames and
// switch to fine ones only around the moment under test.
function setFrameInterval(app, ms) {
  app.window.requestAnimationFrame = callback => app.window.setTimeout(() => callback(app.window.performance.now()), ms);
}

const running = app => app.app.state.audioCtx.oscillators.filter(o => o.running).length;
const panSlider = (app, wheel) => app.document.querySelector(`.pan-slider[data-wheel="${wheel}"]`);
function setPanSlider(app, wheel, value) {
  const slider = panSlider(app, wheel);
  slider.value = String(value);
  slider.dispatchEvent(new app.window.Event('input', { bubbles: true }));
  slider.dispatchEvent(new app.window.Event('change', { bubbles: true }));
}

test('the scheduler keeps frame tasks running on a hidden page', async () => {
  const app = createApp();
  try {
    const scheduler = new app.window.PlaybackScheduler();
    let frames = 0;
    const loop = () => { frames++; scheduler.requestAnimationFrame(loop); };
    scheduler.requestAnimationFrame(loop);
    await app.tick(500);
    const before = frames;
    hidePage(app);
    await app.tick(2000);
    assert.ok(frames - before >= 6, `only ${frames - before} frames ran while hidden`);
    scheduler.clear();
  } finally { app.close(); }
});

test('a guided program keeps moving while the page is hidden', async () => {
  const app = createApp();
  try {
    // quick-refresh: 90 s at 200/212, then 200/210 (5 s glide before the boundary)
    await app.app.startProgram('quick-refresh');
    await app.tick(2000);
    hidePage(app);
    await app.tick(95000);
    const right = app.app.wheelR.getHz();
    assert.ok(Math.abs(right - 210) < 0.01, `right wheel ${right}, expected phase 2's 210 Hz`);
    assert.ok(Math.abs(app.app.state.wheel2.osc.frequency.value - right) < 0.01, 'oscillator did not follow the wheel');
    assert.match(app.document.getElementById('programElapsed').textContent, /^01:3[67]$/);
    assert.equal(app.document.getElementById('phaseBadge').textContent, 'Phase 2 of 4');
  } finally { app.close(); }
});

test('a wheel change on a hidden page still reaches the oscillator', async () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(174); app.app.wheelR.setHz(285);
    app.click('#play'); await app.tick(300);
    hidePage(app);
    app.app.wheelL.setHz(440);
    await app.tick(200);
    assert.equal(app.app.state.wheel1.osc.frequency.value, 440);
  } finally { app.close(); }
});

test('a dynamic journey crosses a phase boundary without a frequency jump', async () => {
  const app = createApp({ frameMs: 1000 });
  try {
    const journey = app.app.DYNAMIC_JOURNEYS['cosmic-drift'];
    assert.ok(journey, 'cosmic-drift journey missing');
    const boundary = journey.phases[0].duration * 1000;
    await app.app.startDynamicJourney('cosmic-drift');
    await app.tick(boundary - 2000);
    setFrameInterval(app, 100);
    await app.tick(1900);
    const before = [app.app.wheelL.getHz(), app.app.wheelR.getHz()];
    await app.tick(200);
    const after = [app.app.wheelL.getHz(), app.app.wheelR.getHz()];
    for (let i = 0; i < 2; i++) {
      assert.ok(Math.abs(after[i] - before[i]) < 1, `wheel ${i} jumped ${before[i]} -> ${after[i]} at the boundary`);
    }
  } finally { app.close(); }
});

test('a dynamic journey that reaches its end fades out instead of cutting', async () => {
  const app = createApp({ frameMs: 2000 });
  try {
    const journey = app.app.DYNAMIC_JOURNEYS['quantum-pulse'];
    await app.app.startDynamicJourney('quantum-pulse');
    await app.tick(journey.duration * 1000 + 2200);
    assert.equal(app.app.state.dynamicJourneyRunning, false);
    const { wheel1, audioCtx } = app.app.state;
    const last = wheel1.gain.gain.events[wheel1.gain.gain.events.length - 1];
    assert.equal(last.type, 'linear');
    assert.equal(last.value, 0);
    assert.ok(last.time - audioCtx.currentTime > 0.5, 'fade shorter than expected');
    assert.equal(app.document.querySelector('#dynamicJourneyStart .btn-text').textContent, 'Ending...');
    await app.tick(3600);
    assert.equal(running(app), 0);
    assert.equal(app.document.querySelector('#dynamicJourneyStart .btn-text').textContent, 'Begin Experience');
  } finally { app.close(); }
});

test('after a program ends, Play then a wheel nudge keeps the same voices', async () => {
  const app = createApp();
  try {
    await app.app.startProgram('deep-calm');
    await app.tick(2000);
    const stopping = app.app.stopProgram(); // the non-immediate path a finished program takes: 3 s fade, then stop
    await app.tick(4000);
    await stopping;
    assert.equal(app.app.state.programRunning, false);
    app.click('#play'); await app.tick(100);
    const { audioCtx } = app.app.state;
    const created = audioCtx.oscillators.length;
    app.key('#wheelL', 'ArrowUp'); await app.tick(100);
    assert.equal(audioCtx.oscillators.length, created, 'wheel nudge rebuilt the voices');
  } finally { app.close(); }
});

test('the program readout shows the frequencies that are gliding into the next phase', async () => {
  const app = createApp({ frameMs: 1000 });
  try {
    await app.app.startProgram('quick-refresh');
    await app.tick(88000); // 2 s before the 90 s boundary: right glides 212 -> 210
    const shown = parseFloat(app.document.getElementById('phaseFreqR').textContent);
    const actual = app.app.wheelR.getHz();
    assert.ok(Math.abs(shown - actual) < 0.6, `readout ${shown} vs wheel ${actual}`);
    assert.ok(actual < 211.5 && actual > 210, `expected a glide in progress, wheel at ${actual}`);
    const beat = parseFloat(app.document.getElementById('phaseBinaural').textContent);
    assert.ok(Math.abs(beat - (actual - app.app.wheelL.getHz())) < 0.6, `beat readout ${beat}`);
  } finally { app.close(); }
});

test('Quick Start starts on its first step instead of sweeping up from a silent wheel', async () => {
  const app = createApp();
  try {
    app.click('.quick-start-btn');
    await app.tick(150);
    assert.ok(app.app.wheelL.getHz() >= 20, `left wheel at ${app.app.wheelL.getHz()} Hz`);
    assert.ok(app.app.wheelR.getHz() >= 20, `right wheel at ${app.app.wheelR.getHz()} Hz`);
    assert.equal(app.app.state.quickStartRunning, true);
  } finally { app.close(); }
});

test('Quick Start and the demo give the user their pan positions back', async () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(174); app.app.wheelR.setHz(285);
    setPanSlider(app, 'wheelL', -30); setPanSlider(app, 'wheelR', 30);
    const button = app.document.querySelector('.quick-start-btn');
    button.click(); await app.tick(2000);
    button.click(); await app.tick(100);
    assert.deepEqual([panSlider(app, 'wheelL').value, panSlider(app, 'wheelR').value], ['-30', '30']);

    app.click('#demoBtn'); await app.tick(3000);
    assert.notEqual(panSlider(app, 'wheelL').value, '-30');
    app.click('#demoBtn'); await app.tick(100);
    assert.deepEqual([panSlider(app, 'wheelL').value, panSlider(app, 'wheelR').value], ['-30', '30']);
  } finally { app.close(); }
});

test('the demo ends on the default audible pair, not at 1 Hz', async () => {
  const app = createApp({ frameMs: 1000 });
  try {
    app.app.startDemo();
    await app.tick(150000);
    assert.equal(app.app.state.demoRunning, false);
    assert.deepEqual([app.app.wheelL.getHz(), app.app.wheelR.getHz()], [256, 256]);
    assert.equal(running(app), 0);
    app.click('#play'); await app.tick(100);
    assert.equal(app.app.state.wheel1.osc.frequency.value, 256);
  } finally { app.close(); }
});

test('Pause during a program fade ends the program cleanly', async () => {
  const app = createApp();
  try {
    await app.app.startProgram('deep-calm');
    await app.tick(2000);
    app.app.stopProgram();
    await app.tick(500);
    assert.equal(app.document.querySelector('#programStart .btn-text').textContent, 'Ending...');
    app.click('#pause'); await app.tick(300);
    assert.equal(app.document.querySelector('#programStart .btn-text').textContent, 'Begin Journey');
    assert.equal(app.document.getElementById('pause').classList.contains('is-active'), false);
    assert.equal(running(app), 0);
  } finally { app.close(); }
});

test('Pause with nothing playing does not light the Pause button', async () => {
  const app = createApp();
  try {
    app.click('#play'); await app.tick(50); app.click('#stop'); await app.tick(300);
    app.click('#pause'); await app.tick(50);
    assert.equal(app.document.getElementById('pause').classList.contains('is-active'), false);
    assert.equal(app.app.state.audioCtx.state, 'running');
  } finally { app.close(); }
});
