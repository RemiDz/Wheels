const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const FakeTimers = require('@sinonjs/fake-timers');

function createApp({ blockedStorage = false, delayedResume = false, delayedSuspend = false, rejectResume = false, frameMs = 100 } = {}) {
  const root = path.resolve(__dirname, '..');
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  const clock = FakeTimers.withGlobal(w).install({ now: 10000,
    toFake: ['Date', 'performance', 'setTimeout', 'clearTimeout', 'setInterval',
      'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame'],
  });
  const errors = [];
  const consoleErrors = [];
  w.console.error = (...args) => consoleErrors.push(args);
  // Coarse frames keep long sequence tests fast without skipping callbacks.
  w.requestAnimationFrame = callback => w.setTimeout(() => callback(w.performance.now()), frameMs);
  w.cancelAnimationFrame = id => w.clearTimeout(id);
  w.addEventListener('error', event => { errors.push(event.error); event.preventDefault(); });
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLElement.prototype.getBoundingClientRect = function () {
    return { x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 400, width: 400, height: 400 };
  };
  w.HTMLElement.prototype.setPointerCapture = () => {};
  w.HTMLElement.prototype.releasePointerCapture = () => {};
  if (blockedStorage) Object.defineProperty(w, 'localStorage', {
    get() { throw new w.DOMException('Storage blocked', 'SecurityError'); },
  });
  class Param {
    constructor(value = 0) { this.value = value; this.events = []; }
    record(type, value, time) {
      if (!Number.isFinite(value) || !Number.isFinite(time)) throw new Error('Invalid audio parameter');
      this.events.push({ type, value, time }); this.value = value; return this;
    }
    setValueAtTime(v, t) { return this.record('set', v, t); }
    setTargetAtTime(v, t) { return this.record('target', v, t); }
    linearRampToValueAtTime(v, t) { return this.record('linear', v, t); }
    exponentialRampToValueAtTime(v, t) { return this.record('exponential', v, t); }
    cancelScheduledValues(t) { this.events = this.events.filter(e => e.time < t); return this; }
    cancelAndHoldAtTime(t) { return this.cancelScheduledValues(t); }
  }
  class AudioNode {
    constructor(ctx) { this.ctx = ctx; this.connections = []; }
    connect(node) { this.connections.push(node); return node; }
    disconnect() { this.connections = []; }
  }
  class Oscillator extends AudioNode {
    constructor(ctx) { super(ctx); this.frequency = new Param(440); this.detune = new Param(); this.startTime = null; this.stopTime = Infinity; }
    start(t = this.ctx.currentTime) { if (this.startTime !== null) throw new Error('Oscillator restarted'); this.startTime = t; }
    stop(t = this.ctx.currentTime) { this.stopTime = t; }
    get running() { return this.startTime !== null && this.stopTime > this.ctx.currentTime; }
  }
  class AudioContext {
    constructor() { this.state = 'suspended'; this.sampleRate = 48000; this.destination = new AudioNode(this); this.oscillators = []; this.offset = 0; this.startedAt = clock.now; }
    get currentTime() { return this.offset + (this.state === 'running' ? (clock.now - this.startedAt) / 1000 : 0); }
    resume() {
      if (rejectResume) return Promise.reject(new Error('Audio activation denied'));
      const resume = () => { if (this.state !== 'running') { this.startedAt = clock.now; this.state = 'running'; } };
      if (delayedResume) return new Promise(resolve => w.setTimeout(() => { resume(); resolve(); }, 100));
      resume(); return Promise.resolve();
    }
    suspend() {
      const suspend = () => { this.offset = this.currentTime; this.state = 'suspended'; };
      if (delayedSuspend) return new Promise(resolve => w.setTimeout(() => { suspend(); resolve(); }, 100));
      suspend(); return Promise.resolve();
    }
    createOscillator() { const osc = new Oscillator(this); this.oscillators.push(osc); return osc; }
    createGain() { const node = new AudioNode(this); node.gain = new Param(1); return node; }
    createStereoPanner() { const node = new AudioNode(this); node.pan = new Param(); return node; }
  }
  w.AudioContext = AudioContext;
  const expose = `
    window.testApp = {
      wheelL, wheelR, frequencyToNote, getDetailedFreqInfo, applyFineTune, applyPitchBend,
      startProgram, stopProgram, startDynamicJourney, startQuickStart, startDemo,
      startOvertonesDemo, startTheoryDemo, stopSchoolDemo, generateOvertones,
      RELAXATION_PROGRAMS, DYNAMIC_JOURNEYS, QUICK_START_PRESETS, calculateHarmonicFrequencies,
      getHarmonicFrequencies, playback, schoolPlayback, updateDynamicJourneyDisplay,
      get state() { return { audioCtx, wheel1, wheel2, monoOsc1, monoOsc2, monoGain,
        programRunning, dynamicJourneyRunning, quickStartRunning, demoRunning,
        overtonesDemoRunning, theoryDemoRunning, harmonicsPlaying, harmonicOscillators,
        harmonicActiveStates, harmonicMutedState, showOvertoneHighlights,
        wheelLMuted, wheelRMuted, currentOvertonesFundamental }; }
    };
  `;
  const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  w.eval(fs.readFileSync(path.join(root, 'playback-scheduler.js'), 'utf8') + '\nwindow.PlaybackScheduler = PlaybackScheduler;');
  w.eval(fs.readFileSync(path.join(root, 'bowl-capture.js'), 'utf8') + '\nwindow.BowlAudio = BowlAudio;');
  try { w.eval(source.replace(/\}\)\(\);\s*$/, expose + '\n})();')); } catch (error) { errors.push(error); }
  return {
    window: w, document: w.document, app: w.testApp, errors, clock,
    click(selector) { w.document.querySelector(selector).click(); },
    select(selector, value) { const el = w.document.querySelector(selector); el.value = value; el.dispatchEvent(new w.Event('change', { bubbles: true })); },
    key(selector, key) { w.document.querySelector(selector).dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); },
    async tick(ms) { await clock.tickAsync(ms); if (errors.length) throw errors[0]; },
    close() { clock.uninstall(); dom.window.close(); },
  };
}
module.exports = { createApp };
