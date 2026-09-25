const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

// iOS rule: resume() only works while a gesture that ends (touch release, tap, key) is being
// handled. Everything else leaves the context suspended with the promise pending.
function iosResumeRule(app) {
  const state = { inGesture: false };
  const proto = app.window.AudioContext.prototype;
  const original = proto.resume;
  proto.resume = function () { return state.inGesture ? original.call(this) : new Promise(() => {}); };
  for (const type of ['pointerup', 'touchend', 'click', 'keydown']) {
    // window capture runs before the app's document listeners
    app.window.addEventListener(type, () => { state.inGesture = true; }, true);
    app.document.addEventListener(type, () => { state.inGesture = false; }, false);
  }
  return state;
}

test('a wheel drag on iOS starts sounding when the finger lifts, without pressing Play', async () => {
  const app = createApp();
  try {
    iosResumeRule(app);
    app.app.wheelL.setHz(220, true); // what pointer moves do during a drag
    await app.tick(100);
    const { audioCtx, wheel1 } = app.app.state;
    assert.equal(audioCtx.state, 'suspended', 'the move alone must not be able to resume');
    assert.ok(wheel1.osc.startTime !== null, 'the voices are scheduled');
    assert.equal(app.document.getElementById('play').classList.contains('is-active'), true);
    app.document.querySelector('#wheelL .pointer').dispatchEvent(new app.window.PointerEvent('pointerup', { bubbles: true }));
    await app.tick(50);
    assert.equal(audioCtx.state, 'running', 'the release gesture should have resumed the context');
    assert.ok(wheel1.osc.running);
  } finally { app.close(); }
});

test('a gesture does not resume a context the user has paused or stopped', async () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(220, true);
    app.click('#play'); await app.tick(200);
    const { audioCtx } = app.app.state;
    app.click('#pause'); await app.tick(200);
    assert.equal(audioCtx.state, 'suspended');
    app.document.body.dispatchEvent(new app.window.PointerEvent('pointerup', { bubbles: true }));
    app.document.body.dispatchEvent(new app.window.MouseEvent('click', { bubbles: true }));
    await app.tick(50);
    assert.equal(audioCtx.state, 'suspended', 'a tap must not undo Pause');
    app.click('#stop'); await app.tick(200);
    app.document.body.dispatchEvent(new app.window.PointerEvent('pointerup', { bubbles: true }));
    await app.tick(50);
    assert.equal(app.document.getElementById('play').classList.contains('is-active'), false);
  } finally { app.close(); }
});
