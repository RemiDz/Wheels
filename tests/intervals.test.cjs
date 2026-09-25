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

const active = app => { const el = app.document.querySelector('#intervalsTable .interval-cell.is-active'); return el ? `${el.dataset.row}-${el.dataset.column}` : null; };
const octave = app => app.document.getElementById('intervalOctave').value;
const lit = app => [...app.document.querySelectorAll('.piano-key.is-left, .piano-key.is-right')].map(k => k.dataset.note).sort();

test('the highlighted cell follows the keys the keyboard lights, so the Scroll wheel moves it', async () => {
  const app = createApp();
  try {
    app.click('#intervalsToggle');
    cell(app, 0, 7).click(); // C4 -> G4
    await app.tick(100);
    assert.equal(active(app), '0-7');
    assert.equal(cell(app, 0, 7).getAttribute('aria-current'), 'true');

    app.app.applyPitchBend(30); // the Scroll wheel: both wheels up 30 Hz -> 291.63 / 422.00
    await app.tick(100);
    assert.deepEqual(lit(app), ['C#4', 'G#4']);
    assert.equal(active(app), '1-8', 'C# to G# is the fifth in row C#');
    assert.equal(cell(app, 0, 7).classList.contains('is-active'), false);
    assert.equal(cell(app, 0, 7).hasAttribute('aria-current'), false);
    assert.equal(octave(app), '4');

    app.key('#pitchBendWheel', 'Home'); // back to the pair
    await app.tick(100);
    assert.equal(active(app), '0-7');

    app.app.wheelL.setHz(392); app.app.wheelR.setHz(261.63); // lower note on the right wheel
    await app.tick(100);
    assert.equal(active(app), '0-7');

    app.app.wheelL.setHz(220); app.app.wheelR.setHz(329.63); // A3 -> E4 moves the octave selector
    await app.tick(100);
    assert.equal(active(app), '9-4');
    assert.equal(octave(app), '3');

    app.app.wheelL.setHz(261.63); app.app.wheelR.setHz(783.99); // C4 -> G5 reduces to the fifth
    await app.tick(100);
    assert.equal(active(app), '0-7');
    assert.equal(octave(app), '4');

    app.app.wheelR.setHz(261.63); // unison has no cell
    await app.tick(100);
    assert.equal(active(app), null);

    app.app.wheelL.setHz(7.83); app.app.wheelR.setHz(392); // below the keyboard
    await app.tick(100);
    assert.equal(active(app), null);

    app.click('#noteSystemToggle'); // a rebuilt table keeps following the wheels
    app.app.wheelL.setHz(261.63);
    await app.tick(100);
    assert.equal(active(app), '0-7');
  } finally { app.close(); }
});

const fill = (app, row, column) => {
  const s = cell(app, row, column).style;
  return { lower: s.getPropertyValue('--fill-lower'), upper: s.getPropertyValue('--fill-upper'), lowerColor: s.getPropertyValue('--fill-lower-color'), upperColor: s.getPropertyValue('--fill-upper-color') };
};

test('the highlighted cell fills up as the Scroll wheel raises the pair and drains as it lowers it', async () => {
  const app = createApp();
  try {
    app.click('#intervalsToggle');
    cell(app, 0, 7).click(); // C4 -> G4, both notes exactly on their keys
    await app.tick(100);
    assert.deepEqual([fill(app, 0, 7).lower, fill(app, 0, 7).upper], ['0.000', '0.000']);

    const ratio = hz => app.app.getKeySpanForFrequency(hz).ratio.toFixed(3);
    app.app.applyPitchBend(10); // C4 + 10 Hz is 0.64 of the way to C#4, G4 + 10 Hz 0.43 of the way to G#4
    await app.tick(100);
    assert.equal(active(app), '0-7');
    assert.equal(fill(app, 0, 7).lower, ratio(app.app.wheelL.getHz()));
    assert.equal(fill(app, 0, 7).upper, ratio(app.app.wheelR.getHz()));
    assert.ok(Number(fill(app, 0, 7).lower) > 0.6 && Number(fill(app, 0, 7).upper) > 0.4, JSON.stringify(fill(app, 0, 7)));
    assert.match(fill(app, 0, 7).lowerColor, /^#[0-9a-f]{6}$/i);
    assert.match(fill(app, 0, 7).upperColor, /^#[0-9a-f]{6}$/i);

    app.app.applyPitchBend(-5); // draining
    await app.tick(100);
    assert.ok(Number(fill(app, 0, 7).lower) < 0.4, fill(app, 0, 7).lower);

    app.app.applyPitchBend(25); // crosses into C#4 / G#4: the old cell empties, the new one starts from its own levels
    await app.tick(100);
    assert.equal(active(app), '1-8');
    assert.deepEqual([fill(app, 0, 7).lower, fill(app, 0, 7).upper, fill(app, 0, 7).lowerColor], ['', '', '']);
    assert.equal(fill(app, 1, 8).lower, ratio(app.app.wheelL.getHz()));
    assert.equal(fill(app, 1, 8).upper, ratio(app.app.wheelR.getHz()));

    app.app.wheelL.setHz(440); app.app.wheelR.setHz(440); // no cell, no leftover fill
    await app.tick(100);
    assert.equal(active(app), null);
    assert.equal(fill(app, 1, 8).lower, '');
  } finally { app.close(); }
});

test('cells are tinted by consonance group, and the readout and reference describe the intervals', async () => {
  const app = createApp();
  try {
    app.click('#intervalsToggle');
    const tone = (row, column) => [...cell(app, row, column).classList].find(c => c.startsWith('tone-'));
    assert.deepEqual([tone(0, 0), tone(0, 5), tone(0, 7)], ['tone-perfect', 'tone-perfect', 'tone-perfect']);
    assert.deepEqual([tone(0, 3), tone(0, 4), tone(0, 8), tone(0, 9)], ['tone-imperfect', 'tone-imperfect', 'tone-imperfect', 'tone-imperfect']);
    assert.deepEqual([tone(0, 2), tone(0, 10)], ['tone-mild', 'tone-mild']);
    assert.deepEqual([tone(0, 1), tone(0, 6), tone(0, 11)], ['tone-sharp', 'tone-sharp', 'tone-sharp']);
    assert.equal(tone(7, 2), 'tone-perfect', 'G to D is a fifth');
    assert.match(cell(app, 0, 7).getAttribute('title'), /^Perfect fifth: .*sonic cuddle/);

    const legend = app.document.getElementById('intervalsLegend');
    assert.equal(legend.querySelectorAll('li.intervals-legend-group').length, 4);
    assert.equal(legend.querySelectorAll('li:not(.intervals-legend-group)').length, 12);
    assert.match(legend.textContent, /Tritone/);
    assert.match(legend.textContent, /pneumatic drill/);

    const readout = app.document.getElementById('intervalsReadout');
    assert.equal(readout.textContent, 'Tap an interval, or move the wheels.');
    cell(app, 0, 7).click();
    await app.tick(100);
    assert.match(readout.textContent, /^Perfect fifth C4 · G4 Uplifting/);
    assert.ok(readout.classList.contains('tone-perfect'));

    app.click('#noteSystemToggle');
    await app.tick(100);
    assert.match(readout.textContent, /Do4 · Sol4/);

    app.app.wheelL.setHz(261.63); app.app.wheelR.setHz(783.99); // C4 -> G5 reads as a fifth with the real notes
    await app.tick(100);
    assert.match(readout.textContent, /^Perfect fifth Do4 · Sol5/);

    app.app.wheelR.setHz(261.63); // unison
    await app.tick(100);
    assert.equal(readout.textContent, 'Tap an interval, or move the wheels.');
    assert.equal(readout.className, 'intervals-readout');
  } finally { app.close(); }
});
