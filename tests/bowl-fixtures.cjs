// Independent signal fixtures: render known waves, then reproduce the browser's
// Blackman-window FFT. Production detection consumes the native AnalyserNode FFT.
function signal({ tones = [[440, 0.3]], sampleRate = 48000, noise = 0, dc = 0, clip = false, impulse = false } = {}) {
  const size = 32768;
  const samples = new Float32Array(size);
  const real = new Float64Array(size);
  const imaginary = new Float64Array(size);
  let seed = 12345;
  for (let i = 0; i < size; i++) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    let value = dc + noise * (seed / 0x100000000 * 2 - 1);
    for (const [frequency, amplitude] of tones) value += amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate);
    if (impulse && i === size / 2) value += 0.8;
    samples[i] = clip ? Math.max(-1, Math.min(1, value)) : value;
    real[i] = samples[i] * (0.42 - 0.5 * Math.cos(2 * Math.PI * i / size) + 0.08 * Math.cos(4 * Math.PI * i / size));
  }
  for (let i = 1, j = 0; i < size; i++) {
    let bit = size >> 1;
    while (j & bit) { j ^= bit; bit >>= 1; }
    j ^= bit;
    if (i < j) [real[i], real[j]] = [real[j], real[i]];
  }
  for (let length = 2; length <= size; length *= 2) {
    const stepReal = Math.cos(-2 * Math.PI / length), stepImaginary = Math.sin(-2 * Math.PI / length);
    for (let start = 0; start < size; start += length) {
      let twiddleReal = 1, twiddleImaginary = 0;
      for (let i = 0; i < length / 2; i++) {
        const a = start + i, b = a + length / 2;
        const vr = real[b] * twiddleReal - imaginary[b] * twiddleImaginary;
        const vi = real[b] * twiddleImaginary + imaginary[b] * twiddleReal;
        real[b] = real[a] - vr; imaginary[b] = imaginary[a] - vi;
        real[a] += vr; imaginary[a] += vi;
        const next = twiddleReal * stepReal - twiddleImaginary * stepImaginary;
        twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal;
        twiddleReal = next;
      }
    }
  }
  const spectrum = new Float32Array(size / 2);
  for (let i = 0; i < spectrum.length; i++) spectrum[i] = 20 * Math.log10(Math.hypot(real[i], imaginary[i]) / size);
  return { spectrum, samples, sampleRate };
}

function microphone(env, { pending = false, rejection = null, input = signal(), pendingResume = false, stalled = false } = {}) {
  const w = env.window;
  const originalContext = w.AudioContext;
  const mic = { input, contexts: [], requests: [], streams: [], sources: [], gains: [] };
  class Context extends originalContext {
    constructor() { super(); this.sampleRate = 48000; mic.contexts.push(this); }
    resume() {
      if (stalled) return new Promise(() => {});
      const resumed = super.resume();
      return pendingResume ? new Promise(() => {}) : resumed;
    }
    createGain() { const gain = super.createGain(); mic.gains.push(gain); return gain; }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createAnalyser() {
      return {
        connections: [], connect(to) { this.connections.push(to); },
        fftSize: 32768, get frequencyBinCount() { return this.fftSize / 2; },
        getFloatFrequencyData(array) { array.set(mic.input.spectrum); },
        getFloatTimeDomainData(array) { array.set(mic.input.samples); },
        disconnect() { this.connections = []; }
      };
    }
    createMediaStreamSource() {
      const node = { connections: [], connect(to) { this.connections.push(to); }, disconnect() { this.disconnected = true; } };
      mic.sources.push(node);
      return node;
    }
  }
  w.AudioContext = Context;
  Object.defineProperty(w.navigator, 'mediaDevices', { configurable: true, value: {
    getUserMedia(constraints) {
      const track = new w.EventTarget();
      track.readyState = 'live'; track.stopCalls = 0;
      track.stop = () => { track.stopCalls++; track.readyState = 'ended'; };
      const stream = { getTracks: () => [track], getAudioTracks: () => [track], track };
      mic.streams.push(stream);
      return new Promise((resolve, reject) => {
        mic.requests.push({ constraints, grant: () => resolve(stream), reject });
        if (rejection) reject(Object.assign(new Error(rejection), { name: rejection }));
        else if (!pending) resolve(stream);
      });
    }
  } });
  return mic;
}

module.exports = { signal, microphone };
