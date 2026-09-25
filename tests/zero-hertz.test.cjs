const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const lastGain = voice => voice.gain.gain.events[voice.gain.gain.events.length - 1].value;

test('a wheel at 0 Hz silences its voice instead of holding a DC level', async () => {
  const app = createApp();
  try {
    app.app.wheelL.setHz(174); app.app.wheelR.setHz(285);
    app.click('#play'); await app.tick(300);
    const { wheel1, wheel2, monoOsc1 } = app.app.state;
    assert.equal(lastGain(wheel1), 0.25);
    app.key('#wheelL', 'Home'); // 0 Hz
    await app.tick(200);
    assert.equal(app.app.wheelL.getHz(), 0);
    assert.equal(lastGain(wheel1), 0, 'left voice still open at 0 Hz');
    assert.equal(monoOsc1._gain.gain.events[monoOsc1._gain.gain.events.length - 1].value, 0);
    assert.equal(lastGain(wheel2), 0.25, 'right voice must be unaffected');
    app.key('#wheelL', 'ArrowUp'); // back to 0.5 Hz: audible again as far as the engine is concerned
    await app.tick(200);
    assert.equal(lastGain(wheel1), 0.25);
  } finally { app.close(); }
});
