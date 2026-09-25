const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const HINT = 'Tap or click anywhere to start the sound.';

// iOS rule: resume() only works while a gesture that ends is being handled.
function iosResumeRule(app) {
  const state = { inGesture: false };
  const proto = app.window.AudioContext.prototype;
  const original = proto.resume;
  proto.resume = function () { return state.inGesture ? original.call(this) : new Promise(() => {}); };
  for (const type of ['pointerup', 'touchend', 'click', 'keydown']) {
    app.window.addEventListener(type, () => { state.inGesture = true; }, true);
    app.document.addEventListener(type, () => { state.inGesture = false; }, false);
  }
  return state;
}
const status = app => app.document.getElementById('audioStatus');
const scrollWheel = (app, id) => app.document.querySelector(`#${id}`).dispatchEvent(new app.window.WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));

test('a scroll that cannot start audio on iOS shows the tap hint, and the next tap starts the sound', async () => {
  const app = createApp();
  try {
    iosResumeRule(app);
    scrollWheel(app, 'wheelL');
    await app.tick(200);
    assert.equal(status(app).hidden, true, 'no hint straight away');
    await app.tick(600);
    assert.equal(status(app).hidden, false);
    assert.equal(status(app).textContent, HINT);
    assert.equal(app.app.state.audioCtx.state, 'suspended');
    app.document.body.dispatchEvent(new app.window.PointerEvent('pointerup', { bubbles: true }));
    await app.tick(50);
    assert.equal(app.app.state.audioCtx.state, 'running');
    assert.equal(status(app).hidden, true, 'hint cleared once running');
  } finally { app.close(); }
});

test('a finger drag shows no hint: the release starts the sound', async () => {
  const app = createApp();
  try {
    iosResumeRule(app);
    const pointer = app.document.querySelector('#wheelL .pointer');
    const fire = (type, x, y) => pointer.dispatchEvent(new app.window.PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }));
    fire('pointerdown', 200, 0);
    for (let i = 1; i <= 6; i++) { fire('pointermove', 200 + 20 * i, 10 * i); await app.tick(250); }
    assert.equal(status(app).hidden, true, 'no hint while the finger is down');
    fire('pointerup', 320, 60);
    await app.tick(700);
    assert.equal(app.app.state.audioCtx.state, 'running');
    assert.equal(status(app).hidden, true);
  } finally { app.close(); }
});

test('where the context resumes at once, nothing is shown', async () => {
  const app = createApp();
  try {
    scrollWheel(app, 'wheelR');
    await app.tick(800);
    assert.equal(app.app.state.audioCtx.state, 'running');
    assert.equal(status(app).hidden, true);
    app.click('#pause'); await app.tick(700);
    assert.equal(status(app).hidden, true, 'a paused context is not an unlock problem');
  } finally { app.close(); }
});
