const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

// A voice is released cleanly when its gain is ramped to 0 before the scheduled stop,
// and the stop itself is in the future rather than an immediate cut.
function releasedCleanly(osc, gain, now) {
  const last = gain.gain.events[gain.gain.events.length - 1];
  return Boolean(last) && last.type === 'linear' && last.value === 0 && last.time <= osc.stopTime && osc.stopTime > now;
}

// A linear ramp scheduled in a later call than the previous ramp starts from that old
// event, so the value steps instantly. Ramps chained in one call are fine.
function unanchoredRamps(gains) {
  return gains.flatMap(gain => gain.gain.events.filter((event, index, events) => event.type === 'linear'
    && index > 0 && events[index - 1].type === 'linear' && events[index - 1].at !== event.at));
}

function trackGains(app) {
  const { audioCtx } = app.app.state;
  const gains = [];
  const original = audioCtx.createGain.bind(audioCtx);
  audioCtx.createGain = () => { const gain = original(); gains.push(gain); return gain; };
  return gains;
}

async function playPair(app) {
  app.app.wheelL.setHz(174); app.app.wheelR.setHz(285);
  app.click('#play'); await app.tick(500);
}

test('Stop and Reset release the wheel and mono voices before stopping them', async () => {
  const app = createApp();
  try {
    await playPair(app);
    let { wheel1, wheel2, monoOsc1, monoOsc2, audioCtx } = app.app.state;
    app.click('#stop');
    let now = audioCtx.currentTime;
    for (const [osc, gain] of [[wheel1.osc, wheel1.gain], [wheel2.osc, wheel2.gain], [monoOsc1, monoOsc1._gain], [monoOsc2, monoOsc2._gain]]) {
      assert.ok(releasedCleanly(osc, gain, now), `hard cut: ${JSON.stringify(gain.gain.events.slice(-2))} stop ${osc.stopTime} now ${now}`);
    }
    await app.tick(300);
    assert.equal(audioCtx.oscillators.filter(o => o.running).length, 0);

    app.click('#play'); await app.tick(500);
    ({ wheel1, wheel2 } = app.app.state);
    app.click('#reset');
    now = audioCtx.currentTime;
    assert.ok(releasedCleanly(wheel1.osc, wheel1.gain, now));
    assert.ok(releasedCleanly(wheel2.osc, wheel2.gain, now));
    await app.tick(300);
    assert.equal(audioCtx.oscillators.filter(o => o.running).length, 0);
  } finally { app.close(); }
});

test('starting a Quick Start over manual playback releases the old voices', async () => {
  const app = createApp();
  try {
    await playPair(app);
    const { wheel1, wheel2, audioCtx } = app.app.state;
    app.click('.quick-start-btn');
    const now = audioCtx.currentTime;
    assert.ok(releasedCleanly(wheel1.osc, wheel1.gain, now));
    assert.ok(releasedCleanly(wheel2.osc, wheel2.gain, now));
    await app.tick(500);
    assert.equal(app.app.state.quickStartRunning, true);
    assert.ok(app.app.state.wheel1.osc.running, 'the quick start voices are playing');
  } finally { app.close(); }
});

test('turning Play Overtones off releases the harmonics and their entrance ramps are anchored', async () => {
  const app = createApp();
  try {
    await playPair(app);
    const gains = trackGains(app);
    app.app.generateOvertones(220);
    app.click('#overtoneHighlightToggle');
    await app.tick(5500);
    const harmonics = app.app.state.harmonicOscillators.filter(h => h.started);
    assert.equal(harmonics.length, 16);
    assert.deepEqual(unanchoredRamps(gains), []);
    app.click('#overtoneHighlightToggle');
    const now = app.app.state.audioCtx.currentTime;
    for (const h of harmonics) assert.ok(releasedCleanly(h.osc, h.gain, now), `harmonic cut: ${JSON.stringify(h.gain.gain.events.slice(-2))}`);
  } finally { app.close(); }
});

test('lesson and theory fade-outs are anchored ramps, not steps, and Stop releases them', async () => {
  const app = createApp();
  try {
    app.click('#play'); await app.tick(50); app.click('#stop'); await app.tick(300);
    const gains = trackGains(app);
    const { audioCtx } = app.app.state;
    for (const topic of ['tone', 'timbre', 'harmonics']) {
      app.select('#conceptSelect', topic); app.click('#explanationDemo .demo-btn');
      await app.tick(4500);
    }
    app.click('#theoryDemoBtn');
    await app.tick(20000);
    const running = audioCtx.oscillators.filter(o => o.running);
    app.click('#stop');
    const now = audioCtx.currentTime;
    for (const osc of running) {
      assert.ok(osc.stopTime > now, 'theory oscillator cut immediately');
      const gain = osc.connections[0];
      if (gain?.gain) assert.equal(gain.gain.events[gain.gain.events.length - 1].value, 0);
    }
    await app.tick(300);
    assert.equal(audioCtx.oscillators.filter(o => o.running).length, 0);
    assert.deepEqual(unanchoredRamps(gains), []);
  } finally { app.close(); }
});

test('Stop during the overtones demo releases the demo voices', async () => {
  const app = createApp();
  try {
    app.click('#play'); await app.tick(50); app.click('#stop'); await app.tick(300);
    const { audioCtx } = app.app.state;
    app.app.startOvertonesDemo();
    await app.tick(60000);
    const running = audioCtx.oscillators.filter(o => o.running);
    assert.ok(running.length > 0, 'no demo oscillators were running at 60 s');
    app.click('#stop');
    const now = audioCtx.currentTime;
    for (const osc of running) assert.ok(osc.stopTime > now, 'demo oscillator cut immediately');
    await app.tick(300);
    assert.equal(audioCtx.oscillators.filter(o => o.running).length, 0);
  } finally { app.close(); }
});

test('the overtones demo fades and timbre morphs are anchored ramps', async () => {
  const app = createApp();
  try {
    app.click('#play'); await app.tick(50); app.click('#stop'); await app.tick(300);
    const gains = trackGains(app);
    app.app.startOvertonesDemo();
    await app.tick(110000);
    assert.equal(app.app.state.overtonesDemoRunning, false, 'the demo should have finished');
    assert.deepEqual(unanchoredRamps(gains), []);
  } finally { app.close(); }
});
