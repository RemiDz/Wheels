const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

test('a wheel change right after choosing a preset clears the preset selects', async () => {
  const app = createApp();
  try {
    app.select('#presetSelect', '2');
    assert.deepEqual([app.app.wheelL.getHz(), app.app.wheelR.getHz()], [136.1, 136.1 * 3 / 2]);
    app.key('#wheelL', 'ArrowUp');
    await app.tick(250);
    assert.equal(app.document.getElementById('presetSelect').value, '');
    assert.equal(app.app.wheelL.getHz(), 136.6);

    app.select('#binauralPresetSelect', 'alpha10');
    assert.deepEqual([app.app.wheelL.getHz(), app.app.wheelR.getHz()], [150, 160]);
    assert.equal(app.document.getElementById('presetSelect').value, '');
    app.key('#wheelR', 'ArrowDown');
    await app.tick(250);
    assert.equal(app.document.getElementById('binauralPresetSelect').value, '');
    assert.equal(app.app.wheelR.getHz(), 159.5);
  } finally { app.close(); }
});

test('choosing a preset keeps the select showing it and clears the other select', async () => {
  const app = createApp();
  try {
    app.select('#binauralPresetSelect', 'theta6');
    await app.tick(250);
    assert.equal(app.document.getElementById('binauralPresetSelect').value, 'theta6');
    app.select('#presetSelect', '1');
    await app.tick(250);
    assert.equal(app.document.getElementById('presetSelect').value, '1');
    assert.equal(app.document.getElementById('binauralPresetSelect').value, '');
    assert.deepEqual([app.app.wheelL.getHz(), app.app.wheelR.getHz()], [136.1, 272.2]);
  } finally { app.close(); }
});
