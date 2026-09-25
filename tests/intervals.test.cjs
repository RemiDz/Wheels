const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers.cjs');

const cell = (app, row, column) => app.document.querySelector(`#intervalsTable .interval-cell[data-row="${row}"][data-column="${column}"]`);
const rowLabels = (app, row) => [...app.document.querySelectorAll(`#intervalsTable .interval-cell[data-row="${row}"]`)].map(b => b.textContent);
const near = (a, b) => Math.abs(a - b) < 0.01;

test('the Intervals button expands a 12 x 12 table of interval names', () => {
  const app = createApp();
  try {
    const panel = app.document.getElementById('intervalsPanel');
    const toggle = app.document.getElementById('intervalsToggle');
    assert.equal(panel.hidden, true);
    app.click('#intervalsToggle');
    assert.equal(panel.hidden, false);
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(app.document.querySelectorAll('#intervalsTable tbody tr').length, 12);
    assert.equal(app.document.querySelectorAll('#intervalsTable .interval-cell').length, 144);
    assert.deepEqual(rowLabels(app, 0), ['8ve', 'm2nd', 'M2nd', 'm3rd', 'M3rd', 'P4th', 'tritone', 'P5th', 'm6th', 'M6th', 'm7th', 'M7th']);
    assert.deepEqual(rowLabels(app, 1), ['M7th', '8ve', 'm2nd', 'M2nd', 'm3rd', 'M3rd', 'P4th', 'tritone', 'P5th', 'm6th', 'M6th', 'm7th']);
    assert.deepEqual(rowLabels(app, 11), ['m2nd', 'M2nd', 'm3rd', 'M3rd', 'P4th', 'tritone', 'P5th', 'm6th', 'M6th', 'm7th', 'M7th', '8ve']);
    assert.equal(cell(app, 0, 7).getAttribute('aria-label'), 'perfect fifth from C to G');
    app.click('#intervalsToggle');
    assert.equal(panel.hidden, true);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  } finally { app.close(); }
});

test('tapping an interval plays the lower note on the left wheel and the upper on the right, in octave 4 by default', async () => {
  const app = createApp();
  try {
    app.click('#intervalsToggle');
    cell(app, 0, 7).click(); // C4 -> G4
    await app.tick(100);
    assert.ok(near(app.app.wheelL.getHz(), 261.63), `left ${app.app.wheelL.getHz()}`);
    assert.ok(near(app.app.wheelR.getHz(), 392.00), `right ${app.app.wheelR.getHz()}`);
    assert.ok(app.app.state.wheel1?.osc.running && app.app.state.wheel2?.osc.running, 'both voices play');
    assert.equal(app.document.getElementById('play').classList.contains('is-active'), true);
    assert.equal(cell(app, 0, 7).classList.contains('is-active'), true);

    cell(app, 1, 0).click(); // C#4 -> C5 (major seventh, the upper note wraps to the next octave)
    await app.tick(100);
    assert.ok(near(app.app.wheelL.getHz(), 277.18), `left ${app.app.wheelL.getHz()}`);
    assert.ok(near(app.app.wheelR.getHz(), 523.25), `right ${app.app.wheelR.getHz()}`);
    assert.equal(cell(app, 0, 7).classList.contains('is-active'), false);
    assert.equal(cell(app, 1, 0).classList.contains('is-active'), true);

    cell(app, 9, 9).click(); // A4 -> A5 octave
    await app.tick(100);
    assert.ok(near(app.app.wheelL.getHz(), 440));
    assert.ok(near(app.app.wheelR.getHz(), 880));
    const lit = [...app.document.querySelectorAll('.piano-key.is-left, .piano-key.is-right')].map(k => k.dataset.note).sort();
    assert.deepEqual(lit, ['A4', 'A5']);
  } finally { app.close(); }
});

test('the octave selector moves the pair and unmuted wheels sound', async () => {
  const app = createApp();
  try {
    app.click('#intervalsToggle');
    app.click('.mute-btn[data-wheel="wheelL"]');
    app.select('#intervalOctave', '3');
    cell(app, 9, 4).click(); // A3 -> E4 (perfect fifth)
    await app.tick(100);
    assert.ok(near(app.app.wheelL.getHz(), 220), `left ${app.app.wheelL.getHz()}`);
    assert.ok(near(app.app.wheelR.getHz(), 329.63), `right ${app.app.wheelR.getHz()}`);
    assert.equal(app.app.state.wheelLMuted, false, 'a muted wheel is unmuted so both notes sound');
    app.select('#intervalOctave', '5'); // re-plays the active interval in the new octave
    await app.tick(100);
    assert.ok(near(app.app.wheelL.getHz(), 880), `left ${app.app.wheelL.getHz()}`);
    assert.ok(near(app.app.wheelR.getHz(), 1318.51), `right ${app.app.wheelR.getHz()}`);
  } finally { app.close(); }
});

test('the table follows the note-name system', () => {
  const app = createApp();
  try {
    app.click('#intervalsToggle');
    const headers = () => [...app.document.querySelectorAll('#intervalsTable thead th')].slice(1).map(th => th.textContent);
    assert.deepEqual(headers().slice(0, 3), ['C', 'C#', 'D']);
    app.click('#noteSystemToggle');
    assert.deepEqual(headers().slice(0, 3), ['Do', 'Do#', 'Re']);
    assert.equal(cell(app, 0, 7).getAttribute('aria-label'), 'perfect fifth from Do to Sol');
  } finally { app.close(); }
});
