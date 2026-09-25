const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const pointerAngle = (app, id) => {
  const pointer = app.document.querySelector(`#${id} .pointer`);
  return parseFloat(/rotate\(([-\d.]+)deg\)/.exec(pointer.style.transform)[1]);
};

test('the pointer stays just short of 12 o\'clock at 4200 Hz instead of wrapping to the 0.1 Hz label', () => {
  const app = createApp();
  try {
    app.key('#wheelL', 'End');
    assert.equal(app.document.querySelector('#wheelL .hub .hz').textContent, '4200.000');
    const angle = pointerAngle(app, 'wheelL');
    assert.ok(angle > 359 && angle < 360, `pointer drawn at ${angle}deg for 4200 Hz`);
    app.app.wheelL.setHz(4199.9);
    assert.ok(pointerAngle(app, 'wheelL') < angle, 'a lower frequency must sit anticlockwise of 4200 Hz');
    app.key('#wheelL', 'Home');
    assert.equal(pointerAngle(app, 'wheelL'), 0);
  } finally { app.close(); }
});
