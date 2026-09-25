/* Microphone analysis stays on this device. A zero-gain output prevents feedback. */
const BowlAudio = (() => {
  const MIN_HZ = 40;
  const MAX_HZ = 4000;
  // Peaks closer than this to the strongest one, in dB, count as candidates; the lowest
  // of them is reported so a hard strike that favours a bowl's second partial still
  // yields the note the ear hears.
  const CANDIDATE_DB = 10;
  // A tone must stand this far above the spectrum around it; broadband noise cannot.
  const PROMINENCE_DB = 12;
  // Mains hum. 50 and 60 Hz are never an instrument here; their first harmonics are
  // ignored unless nothing else comes within 20 dB (a bowl near G2 is plausible).
  const HUM_FREQUENCIES = [50, 60];
  const HUM_HARMONICS = [100, 120];
  const HUM_HZ = 1.5;

  const cents = (a, b) => 1200 * Math.log2(a / b);

  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // Sum of linear power over the bins around a peak (the Blackman main lobe).
  function clusterPower(spectrum, bin, first, last) {
    let power = 0;
    for (let i = Math.max(first, bin - 2); i <= Math.min(last, bin + 2); i++) {
      if (Number.isFinite(spectrum[i])) power += 10 ** (spectrum[i] / 10);
    }
    return power;
  }

  // How far a peak rises above the median level of the bins around it (excluding its own lobe).
  function prominence(spectrum, bin, first, last) {
    const around = [];
    for (let i = Math.max(first, bin - 24); i <= Math.min(last, bin + 24); i++) {
      if (Math.abs(i - bin) > 3 && Number.isFinite(spectrum[i])) around.push(spectrum[i]);
    }
    return around.length ? spectrum[bin] - median(around) : Infinity;
  }

  // Local maxima above floorDb, strongest first, merging anything within one main lobe.
  function findPeaks(spectrum, first, last, floorDb) {
    const peaks = [];
    for (let i = first; i <= last; i++) {
      const db = spectrum[i];
      if (!Number.isFinite(db) || db < floorDb) continue;
      if (db > spectrum[i - 1] && db >= spectrum[i + 1]) peaks.push({ bin: i, db });
    }
    peaks.sort((a, b) => b.db - a.db);
    const kept = [];
    for (const peak of peaks) {
      if (kept.every(other => Math.abs(other.bin - peak.bin) > 3)) kept.push(peak);
      if (kept.length >= 12) break;
    }
    return kept;
  }

  // Estimate the instrument's tone from an AnalyserNode spectrum (Blackman window, dB) and
  // the matching time-domain samples. Returns { frequency, rms, concentration, prominence }
  // or { reason } explaining why nothing was accepted.
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
    // Raw device input can be much quieter with automatic gain control disabled.
    if (rms < 0.0002) return { reason: 'quiet', rms };

    const binHz = sampleRate / (spectrum.length * 2);
    const first = Math.max(1, Math.floor(MIN_HZ / binHz));
    const last = Math.min(spectrum.length - 2, Math.ceil(MAX_HZ / binHz));
    let totalPower = 0;
    for (let i = first; i <= last; i++) {
      if (Number.isFinite(spectrum[i])) totalPower += 10 ** (spectrum[i] / 10);
    }
    if (totalPower === 0) return { reason: 'quiet', rms };

    let peaks = findPeaks(spectrum, first, last, -85);
    // Sound reaching the microphone without a single bin standing out is unpitched noise.
    if (!peaks.length) return { reason: rms >= 0.001 ? 'noise' : 'quiet', rms };

    // A much louder sound outside the instrument range masks the tone: anything above
    // 4 kHz that is 6 dB louder, or rumble below 40 Hz that is 20 dB louder.
    const strongestDb = peaks[0].db;
    const audibleEnd = Math.min(spectrum.length - 1, Math.ceil(20000 / binHz));
    for (let i = last + 1; i <= audibleEnd; i++) {
      if (spectrum[i] > strongestDb + 6) return { reason: 'range', rms };
    }
    for (let i = Math.max(1, Math.floor(20 / binHz)); i < first; i++) {
      if (spectrum[i] > strongestDb + 20) return { reason: 'range', rms };
    }

    // Mains hum is not an instrument: ignore it (and its energy) unless it is all there
    // is by a wide margin.
    const near = (peak, frequencies) => frequencies.some(hum => Math.abs(peak.bin * binHz - hum) <= HUM_HZ);
    const isHum = peak => near(peak, HUM_FREQUENCIES) || near(peak, HUM_HARMONICS);
    const hum = peaks.filter(peak => near(peak, HUM_FREQUENCIES) || (near(peak, HUM_HARMONICS)
      && !peaks.every(other => other === peak || isHum(other) || peak.db >= other.db + 20)));
    peaks = peaks.filter(peak => !hum.includes(peak));
    if (!peaks.length) return { reason: 'noise', rms };
    const humPower = hum.reduce((total, peak) => total + clusterPower(spectrum, peak.bin, first, last), 0);

    // Most of the in-range energy must sit in a few peaks; broadband noise spreads it out.
    const peakPower = peaks.reduce((total, peak) => total + clusterPower(spectrum, peak.bin, first, last), 0);
    const concentration = peakPower / Math.max(peakPower, totalPower - humPower);
    if (concentration < 0.3) return { reason: 'noise', rms };

    // The lowest peak within CANDIDATE_DB of the strongest that clearly stands out.
    const strongest = peaks[0];
    let chosen = null;
    for (const peak of peaks) {
      if (peak.db < strongest.db - CANDIDATE_DB) continue;
      if (prominence(spectrum, peak.bin, first, last) < PROMINENCE_DB) continue;
      if (!chosen || peak.bin < chosen.bin) chosen = peak;
    }
    if (!chosen) return { reason: 'noise', rms };

    // Interpolate the peak on the dB scale.
    const peak = chosen.bin;
    const a = spectrum[peak - 1], b = spectrum[peak], c = spectrum[peak + 1];
    const curvature = a - 2 * b + c;
    const offset = Number.isFinite(curvature) && curvature < 0
      ? Math.max(-0.5, Math.min(0.5, 0.5 * (a - c) / curvature)) : 0;
    const frequency = (peak + offset) * binHz;
    if (frequency < MIN_HZ || frequency > MAX_HZ) return { reason: 'range', rms };
    return { frequency, rms, concentration, prominence: prominence(spectrum, peak, first, last) };
  }

  // Readings over the last WINDOW_MS. The pitch counts as steady when most readings sit
  // within INLIER_CENTS of their median and the median is not drifting, so a bowl whose
  // lowest mode beats (the reading wobbles with the beat) still locks on its centre, and
  // one stray reading does not throw a second of progress away.
  const WINDOW_MS = 1200;
  const LOCK_MS = 1100;
  const GAP_MS = 400;
  const INLIER_CENTS = 15;
  const DRIFT_CENTS = 8;

  class StableTone {
    constructor() { this.reset(); }
    reset() { this.samples = []; }
    update(reading, now) {
      const last = this.samples[this.samples.length - 1];
      if (last && (now <= last.time || now - last.time > GAP_MS)) this.reset();
      if (!Number.isFinite(reading?.frequency) || reading.frequency <= 0) {
        this.reset();
        return { progress: 0, canLock: false };
      }
      this.samples.push({ frequency: reading.frequency, time: now });
      this.samples = this.samples.filter(sample => now - sample.time <= WINDOW_MS);
      const centre = median(this.samples.map(sample => sample.frequency));
      const inliers = this.samples.filter(sample => Math.abs(cents(sample.frequency, centre)) <= INLIER_CENTS);
      const frequency = median(inliers.map(sample => sample.frequency));
      const half = Math.floor(inliers.length / 2);
      const drift = inliers.length >= 4
        ? Math.abs(cents(median(inliers.slice(half).map(s => s.frequency)), median(inliers.slice(0, half).map(s => s.frequency))))
        : 0;
      const stable = inliers.length >= 0.8 * this.samples.length && drift <= DRIFT_CENTS;
      const duration = stable ? inliers[inliers.length - 1].time - inliers[0].time : 0;
      return { frequency, progress: stable ? Math.min(1, duration / LOCK_MS) : 0,
        canLock: stable && inliers.length >= 6, locked: stable && duration >= LOCK_MS && inliers.length >= 9 };
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

  // The 45 s deadline message says what actually happened.
  function timeoutMessage(session) {
    if (!session.listening) return 'No tone was captured. Try again, allow microphone access, and play one instrument near the microphone.';
    if (!session.sawTone) return 'No steady tone was heard. Play one instrument close to the microphone and try again.';
    return 'The tone kept changing before it could lock. Tap Lock tone while the reading is steady, or strike more softly and try again.';
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
      const session = { channel, stable: new StableTone(), candidate: null, sawTone: false };
      this.session = session;
      this.onState('requesting', channel);
      const AudioContext = this.env.AudioContext || this.env.webkitAudioContext;
      if (this.env.isSecureContext === false || !this.env.navigator?.mediaDevices?.getUserMedia || !AudioContext) {
        this.finish(session, 'error', { message: 'Microphone capture needs a supported browser on HTTPS or localhost.' });
        return;
      }
      session.deadline = this.env.setTimeout(() => this.finish(session, 'timeout', { message: timeoutMessage(session) }), 45000);
      try {
        session.context = new AudioContext();
        // Build the graph before activation: some engines initialise rendering lazily.
        session.analyser = session.context.createAnalyser();
        session.analyser.fftSize = 32768;
        session.analyser.smoothingTimeConstant = 0;
        session.silentOutput = session.context.createGain();
        session.silentOutput.gain.value = 0;
        session.analyser.connect(session.silentOutput);
        session.silentOutput.connect(session.context.destination);
        // Resume inside the gesture. Observe the audio clock below instead of waiting
        // indefinitely for a browser's resume promise before connecting the microphone.
        const resume = () => Promise.resolve(session.context.resume()).catch(error => {
          this.finish(session, 'error', { message: microphoneError(error) });
        });
        resume();
        const stream = await this.env.navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
          video: false
        });
        // Stop late grants too: cancellation cannot dismiss the browser's permission prompt.
        if (this.session !== session) { stream.getTracks().forEach(track => track.stop()); return; }
        session.stream = stream;
        const tracks = stream.getAudioTracks();
        if (!tracks.length || tracks.every(track => track.readyState === 'ended')) throw new Error('No live audio track');
        session.onEnded = () => this.finish(session, 'error', { message: 'The microphone disconnected. Reconnect it and try again.' });
        tracks.forEach(track => track.addEventListener('ended', session.onEnded));
        session.source = session.context.createMediaStreamSource(stream);
        session.source.connect(session.analyser);
        if (session.context.state !== 'running') resume();
        session.spectrum = new Float32Array(session.analyser.frequencyBinCount);
        session.samples = new Float32Array(session.analyser.fftSize);
        session.startedAt = this.env.performance.now();
        session.startedAudioTime = session.context.currentTime;
        session.warmup = session.analyser.fftSize / session.context.sampleRate + 0.08;
        this.onState('starting', channel);
        this.poll(session);
      } catch (error) {
        this.finish(session, 'error', { message: microphoneError(error) });
      }
    }

    poll(session) {
      if (this.session !== session) return;
      try {
        const now = this.env.performance.now();
        const audioTime = session.context.currentTime;
        if (!session.listening) {
          if (session.context.state === 'running' && audioTime > session.startedAudioTime) {
            session.listening = true;
            this.onState('listening', session.channel);
          } else if (now - session.startedAt >= 6000) {
            this.finish(session, 'error', { message: 'Microphone access is allowed, but the audio engine did not start. Press Start listening again; if it persists, reload this page in your browser.' });
            return;
          } else {
            session.timer = this.env.setTimeout(() => this.poll(session), 80);
            return;
          }
        }
        if (session.context.state !== 'running') {
          this.finish(session, 'error', { message: 'Microphone listening was interrupted. Press Start listening to try again.' });
          return;
        }
        if (audioTime - session.startedAudioTime >= session.warmup) {
          session.analyser.getFloatFrequencyData(session.spectrum);
          session.analyser.getFloatTimeDomainData(session.samples);
          const reading = detectTone(session.spectrum, session.samples, session.context.sampleRate);
          if (reading.frequency) session.sawTone = true;
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
      try { session.silentOutput?.disconnect(); } catch {}
      try { session.context?.close()?.catch(() => {}); } catch {}
      this.onFinish({ reason, channel: session.channel, ...data });
    }
  }

  return { Capture, StableTone, detectTone, describeInterval, MIN_HZ, MAX_HZ };
})();
