# Verification

The app remains a static site. No build or runtime package installation is required to serve it.

For development checks, use Node.js 24 and run:

```sh
npm ci
npm run check
npm run lint
npm test
```

For a local preview, run `python -m http.server 3310 --bind 127.0.0.1` in this folder, then open http://127.0.0.1:3310/.

The regression suite loads the real HTML and application script in jsdom. It uses a simulated AudioContext and controllable clocks to exercise transport controls, cancellation during audio activation, mode switching, complete journeys and demos, all music lessons, wheel boundaries, tuning, mute, overtones and keyboard controls. Service-worker tests execute the actual worker with simulated network and cache storage, checking asset availability, updates, offline responses and cache isolation.

The input regression tests also cover delayed audio activation and suspension, rapid Play/Pause changes, obsolete activation errors, recovery after an audio interruption, piano scrolling during a sequence, and switching from overtones back to wheel tones. Muted harmonic indicators are checked after selecting a new note. Cache opening, reading and writing failures are tested independently.

Further suites cover note naming for two-decimal frequencies, synchronous presets, fine-tune and pitch-bend offsets, the wheel pointer at 4200 Hz, the fade-based voice release, Play Overtones, journeys on a hidden page, the 0 Hz guard and instrument-like capture signals (beating bowls, louder partials, hum, rumble).

Stop, Reset and every switch between activities fade the voices out over 30 ms before stopping them, and lesson, theory and overtones-demo fade-outs are anchored ramps rather than steps. Scripted journeys keep running while the page is hidden or the phone screen is off: the scheduler drives them from a 250 ms timer whenever animation frames stop, and the oscillators follow the wheels. To check, start a journey, hide the tab or lock the phone for a minute and confirm the readouts and audio have advanced on return. A wheel at 0 Hz is silent rather than a held DC level.

The Node regression tests do not render a browser layout or generate real audio. Also inspect the desktop and phone layouts, listen to both headphone channels, check touch dragging and the volume sliders, and verify installation and offline reload in a browser. An optional native Chromium microphone check is documented below; physical microphone and iPad checks still need a real device.

For the changed controls, press Pause immediately after starting a journey, then press Play immediately after Pause. The final button choice should determine playback. Scroll vertically over a piano key while Quick Start runs: the sequence should stop and the chosen frequency should remain. After stopping normal playback, enable and disable Overtones: the wheel tones should return. Disabling Overtones while paused or stopped should preserve that transport state.

Playback scheduling uses a shared pause-aware clock; stopped sessions cancel their owned callbacks and audio nodes. Audio parameter updates cancel superseded automation as described in [MDN's AudioParam reference](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelScheduledValues). The worker refreshes app assets online and retains an offline copy following the [service-worker lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

Audio activation and suspension reconcile with the latest user request, since [Web Audio context transitions are asynchronous](https://www.w3.org/TR/webaudio/#dom-audiocontext-resume). Failures belonging to an earlier request cannot stop the current session. Worker cache version `nestorium-v11` includes the click-free voice release, the hidden-page scheduler fallback and the instrument-aware Sound Capture detector. Online loading can continue when cache storage is unavailable.

The Mono slider runs left to right from 0% to 100%. Check mouse/touch dragging, cancellation and the existing arrow, Home and End keyboard controls. On tablet widths, both wheels flank the centre panel in portrait and landscape; narrower phones retain their stacked layout. Each frequency, note and tuning offset now sits above its own wheel. The waveform stays visible in the centre. Expand and collapse Captured tones & interval: both wheels and their controls should stay at the same vertical position in the side-by-side layout.

## Microphone sound capture

Sound Capture sits inside the centre panel, directly below Fine Tune. Select Left or Right, press Start listening, allow microphone access, and play an instrument near the microphone. Use singing bowls, tuning forks, chimes or other instruments with a clear, sustained tone. The selected wheel and piano position follow the detected tone silently. A steady pitch locks automatically after about 1.1 seconds of stable readings, following the analyser's initial buffer fill. Lock tone becomes available after about half a second of steady readings. Let the first sound fade, select the other wheel, and repeat.

Play both restores both saved pitches, unmutes the wheels, pans Left fully left and Right fully right, sets the mono mix to zero, and uses the existing Play/Pause/Stop controls. Piano reference scrolls to the keyboard, which includes the current wheel frequencies, nearest notes and interval. Captured values remain available while trying other app functions; Reset clears them. They are kept only for the current page session.

The detector finds the spectral peaks from 40 to 4,000 Hz and reports the lowest one within 10 dB of the strongest, so a bowl struck hard enough to favour its second partial still captures the note the ear hears; a partial more than 10 dB louder than the fundamental is reported instead. Mains hum at 50 and 60 Hz is ignored, and sound below 40 Hz only masks the tone when it is 20 dB louder. A bowl whose lowest mode beats locks on the centre of its wobble. Complex or unpitched sounds may not produce a stable capture. It recreates those frequencies as sine tones, not recordings of the instrument's timbre. Intervals show the nearest equal-tempered name, actual ratio and cents, deviation from equal temperament, and frequency difference. Capture labels use the nearest note at A4 = 440 Hz. The existing piano fill still shows the continuous frequency position between keys.

The microphone requires a secure origin (HTTPS or localhost) and user permission, as documented by [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). Audio is processed locally using an [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API) connected through a gain fixed at zero to keep the audio graph active without audible microphone monitoring. No microphone audio is recorded or uploaded. Echo cancellation, noise suppression and automatic gain control are requested off. The browser may retain device processing according to its capabilities.

Analysis uses a 32,768-sample Blackman FFT with [quadratic interpolation of spectral peaks](https://www.dsprelated.com/freebooks/sasp/Quadratic_Interpolation_Spectral_Peaks.html). A level gate, clipping check, peak-prominence and concentration checks reject silence, broadband noise and brief strikes; a 1.2-second stability window (most readings within 15 cents of their median, drift under 8 cents) rejects changing pitches without discarding progress on one stray reading. Capture ends after 45 seconds without a lock. Cancel, Stop, Pause, Play, Reset, another activity, a channel change, Escape, hiding the page or leaving it release the microphone. Cancellation restores the uncommitted wheel preview; a direct wheel adjustment keeps the new user-selected value. Late permission grants are stopped immediately and cannot restart cancelled captures.

Automated detector tests render synthetic sinusoids and inharmonic mixtures through an independent FFT fixture at 44.1, 48 and 96 kHz. Tested single tones from 40.3 to 3,990 Hz stay within 0.15 Hz of the generated frequency. This is a synthetic test tolerance, not a hardware accuracy guarantee. Tests also cover noise, clipping, silence, pitch drift, exact and compound intervals, microphone permission failures, late grants/errors, interruptions, resource cleanup, two independent captures, piano highlights, and stereo replay.

During capture, Cancel and Lock tone replace Start listening and Play both. Captured tones, interval details and help remain available under the expandable Captured tones & interval section. The waveform is always visible above Mono. The microphone-level meter shows incoming sound separately from pitch stability. A moving meter without a frequency means there is input but no accepted steady pitch; a zero meter means no input samples above the display floor. Capture now creates its silent audio graph before activation and waits for the audio clock to advance, without blocking on a possibly pending resume promise. If the engine never starts, the app releases the microphone and reports the failure after six seconds. The analyser warmup uses audio time instead of wall time.

Raw microphone levels can be low when automatic gain control is disabled. The detector accepts RMS levels down to 0.0002 and spectral peaks down to −85 dBFS while retaining spectral concentration, clipping and pitch-stability checks. A native Chrome reproduction received a 440 Hz signal at approximately 0.000708 RMS but the old detector rejected it; after this fix the same input locked at 440.01 Hz. This verifies the quiet-input failure, not the cause of every device-specific microphone problem.

Run the optional real browser audio check with an installed Chromium browser:

```sh
node tests/browser-capture.cjs "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

It uses isolated temporary profiles and generated fake microphone WAVs with the real browser audio engine and the actual app. It verifies ordinary and quiet 440 Hz captures, input-meter activity and broadband-noise rejection. It never opens the physical microphone. Autoplay and permission prompts are bypassed for automation; these checks do not establish Safari/iPad gesture or hardware behaviour.

Test with actual instruments on desktop and mobile: verify both captures against a known reference tone, check that the strongest partial is the intended one, confirm the microphone indicator turns off after locking/cancelling, and listen to the left/right isolation through headphones. Inspect the panel in light and dark themes at phone and desktop widths. Repeat after an offline reload to check the cached capture module.
