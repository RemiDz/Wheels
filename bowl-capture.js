/* Microphone analysis stays on this device. The input is never routed to speakers. */
const BowlAudio = (() => {
  const MIN_HZ = 40;
  const MAX_HZ = 4000;

  // Estimate the strongest spectral component, not a guessed harmonic fundamental.
  // AnalyserNode uses a Blackman window; interpolate its peak on the dB scale.
  function detectTone(spectrum, samples, sampleRate) {
    if (!spectrum?.length || !samples?.length || !(sampleRate > 0)) return { reason: 'quiet' };
    let sum = 0, squareSum = 0, clipped = 0;
    for (const sample of samples) {
      if (!Number.isFinite(sample)) return { reason: 'quiet' };
      sum += sample;
      squareSum += sample * sample;
      if (Math.abs(sample) >= 0.985) clipped++;
    }
    const rms = Math.sqrt(Math.max(0, squareSum / samples.length - (sum / samples.length) ** 2));
    if (clipped / samples.length > 0.01) return { reason: 'clipping', rms };
    if (rms < 0.002) return { reason: 'quiet', rms };

    const binHz = sampleRate / (spectrum.length * 2);
    const first = Math.max(1, Math.floor(MIN_HZ / binHz));
    const last = Math.min(spectrum.length - 2, Math.ceil(MAX_HZ / binHz));
    let peak = first, peakDb = -Infinity, totalPower = 0;
    for (let i = first; i <= last; i++) {
      const db = spectrum[i];
      if (!Number.isFinite(db)) continue;
      totalPower += 10 ** (db / 10);
      if (db > peakDb) { peak = i; peakDb = db; }
    }
    let audiblePeak = -Infinity;
    const audibleEnd = Math.min(spectrum.length - 1, Math.ceil(20000 / binHz));
    for (let i = Math.max(1, Math.floor(20 / binHz)); i <= audibleEnd; i++) {
      if (Number.isFinite(spectrum[i])) audiblePeak = Math.max(audiblePeak, spectrum[i]);
    }
    if (audiblePeak > peakDb + 6) return { reason: 'range', rms };
    if (peakDb < -65 || totalPower === 0) return { reason: 'quiet', rms };

    let peakPower = 0;
    for (let i = Math.max(first, peak - 2); i <= Math.min(last, peak + 2); i++) {
      if (Number.isFinite(spectrum[i])) peakPower += 10 ** (spectrum[i] / 10);
    }
    const concentration = peakPower / totalPower;
    if (concentration < 0.18) return { reason: 'noise', rms };
    const a = spectrum[peak - 1], b = spectrum[peak], c = spectrum[peak + 1];
    const curvature = a - 2 * b + c;
    const offset = Number.isFinite(curvature) && curvature < 0
      ? Math.max(-0.5, Math.min(0.5, 0.5 * (a - c) / curvature)) : 0;
    const frequency = (peak + offset) * binHz;
    if (frequency < MIN_HZ || frequency > MAX_HZ) return { reason: 'range', rms };
    return { frequency, rms, concentration };
  }

  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  class StableTone {
    constructor() { this.reset(); }
    reset() { this.samples = []; }
    update(reading, now) {
      if (!Number.isFinite(reading?.frequency) || reading.frequency <= 0) {
        this.reset();
        return { progress: 0, canLock: false };
      }
      const last = this.samples[this.samples.length - 1];
      if (last && (now - last.time > 250 || now <= last.time)) this.reset();
      const frequencies = this.samples.map(s => s.frequency).concat(reading.frequency);
      if (1200 * Math.log2(Math.max(...frequencies) / Math.min(...frequencies)) > 8) this.reset();
      this.samples.push({ frequency: reading.frequency, time: now });
      const duration = now - this.samples[0].time;
      const frequency = median(this.samples.map(s => s.frequency));
      return { frequency, progress: Math.min(1, duration / 1100),
        canLock: this.samples.length >= 3, locked: duration >= 1100 && this.samples.length >= 9 };
    }
  }

  function describeInterval(left, right) {
    if (![left, right].every(hz => Number.isFinite(hz) && hz >= 20)) return null;
    const ratio = Math.max(left, right) / Math.min(left, right);
    const cents = 1200 * Math.log2(ratio);
    const semitones = Math.round(cents / 100);
    const names = ['Unison', 'Minor second', 'Major second', 'Minor third', 'Major third',
      'Perfect fourth', 'Tritone', 'Perfect fifth', 'Minor sixth', 'Major sixth', 'Minor seventh', 'Major seventh'];
    const octaves = Math.floor(semitones / 12);
    const remainder = semitones % 12;
    let name = names[remainder];
    if (octaves && !remainder) name = octaves === 1 ? 'Octave' : `${octaves} octaves`;
    else if (octaves) name = `${octaves === 1 ? 'Octave' : `${octaves} octaves`} + ${name.toLowerCase()}`;
    return { name, ratio, cents, deviation: cents - semitones * 100, difference: Math.abs(left - right) };
  }

  function microphoneError(error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
      return 'Microphone access was denied. Allow it in your browser’s site settings, then try again.';
    }
    if (error?.name === 'NotFoundError') return 'No microphone was found. Connect one and try again.';
    if (error?.name === 'NotReadableError') return 'The microphone is unavailable. Check that another app is not using it.';
    return 'The microphone could not start. Check your input device and try again.';
  }

  class Capture {
    constructor({ onState = () => {}, onReading = () => {}, onFinish = () => {} } = {}, environment = globalThis) {
      this.env = environment;
      this.onState = onState;
      this.onReading = onReading;
      this.onFinish = onFinish;
      this.session = null;
    }
    get active() { return this.session !== null; }
    get channel() { return this.session?.channel; }

    async start(channel) {
      this.cancel();
      if (channel !== 'left' && channel !== 'right') return;
      const session = { channel, stable: new StableTone(), candidate: null };
      this.session = session;
      this.onState('requesting', channel);
      const AudioContext = this.env.AudioContext || this.env.webkitAudioContext;
      if (this.env.isSecureContext === false || !this.env.navigator?.mediaDevices?.getUserMedia || !AudioContext) {
        this.finish(session, 'error', { message: 'Microphone capture needs a supported browser on HTTPS or localhost.' });
        return;
      }
      session.deadline = this.env.setTimeout(() => this.finish(session, 'timeout', {
        message: 'No tone was captured. Try again, allow microphone access, and play one instrument near the microphone.'
      }), 45000);
      try {
        session.context = new AudioContext();
        // Resume in the button gesture, while the permission request may still be open.
        const resumed = Promise.resolve(session.context.resume()).then(() => true, error => {
          this.finish(session, 'error', { message: microphoneError(error) });
          return false;
        });
        const stream = await this.env.navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
          video: false
        });
        // Stop late grants too: cancellation cannot dismiss the browser's permission prompt.
        if (this.session !== session) { stream.getTracks().forEach(track => track.stop()); return; }
        session.stream = stream;
        if (!await resumed || this.session !== session) return;
        const tracks = stream.getAudioTracks();
        if (!tracks.length || tracks.every(track => track.readyState === 'ended')) throw new Error('No live audio track');
        session.onEnded = () => this.finish(session, 'error', { message: 'The microphone disconnected. Reconnect it and try again.' });
        tracks.forEach(track => track.addEventListener('ended', session.onEnded));
        session.analyser = session.context.createAnalyser();
        session.analyser.fftSize = 32768;
        session.analyser.smoothingTimeConstant = 0;
        session.source = session.context.createMediaStreamSource(stream);
        session.source.connect(session.analyser);
        session.spectrum = new Float32Array(session.analyser.frequencyBinCount);
        session.samples = new Float32Array(session.analyser.fftSize);
        session.startedAt = this.env.performance.now();
        session.warmup = session.analyser.fftSize / session.context.sampleRate * 1000 + 80;
        this.onState('listening', channel);
        this.poll(session);
      } catch (error) {
        this.finish(session, 'error', { message: microphoneError(error) });
      }
    }

    poll(session) {
      if (this.session !== session) return;
      try {
        if (session.context.state !== 'running') {
          this.finish(session, 'error', { message: 'Microphone listening was interrupted. Press Start listening to try again.' });
          return;
        }
        const now = this.env.performance.now();
        if (now - session.startedAt >= session.warmup) {
          session.analyser.getFloatFrequencyData(session.spectrum);
          session.analyser.getFloatTimeDomainData(session.samples);
          const reading = detectTone(session.spectrum, session.samples, session.context.sampleRate);
          const stable = session.stable.update(reading, now);
          session.candidate = stable.canLock ? stable.frequency : null;
          this.onReading({ ...reading, ...stable }, session.channel);
          if (stable.locked) { this.lock(); return; }
        }
        session.timer = this.env.setTimeout(() => this.poll(session), 80);
      } catch (error) {
        this.finish(session, 'error', { message: microphoneError(error) });
      }
    }

    lock() {
      const session = this.session;
      if (!session?.candidate) return false;
      this.finish(session, 'locked', { frequency: session.candidate });
      return true;
    }
    cancel() { if (this.session) this.finish(this.session, 'cancelled'); }

    finish(session, reason, data = {}) {
      if (this.session !== session) return;
      this.session = null;
      this.env.clearTimeout(session.timer);
      this.env.clearTimeout(session.deadline);
      session.stream?.getTracks().forEach(track => {
        track.removeEventListener('ended', session.onEnded);
        track.stop();
      });
      try { session.source?.disconnect(); } catch {}
      try { session.analyser?.disconnect(); } catch {}
      try { session.context?.close()?.catch(() => {}); } catch {}
      this.onFinish({ reason, channel: session.channel, ...data });
    }
  }

  return { Capture, StableTone, detectTone, describeInterval, MIN_HZ, MAX_HZ };
})();
