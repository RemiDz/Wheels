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

The checks do not render a browser layout or generate real audio. Before publishing, inspect the desktop and phone layouts, listen to both headphone channels, check touch dragging and the volume sliders, and verify installation and offline reload in a browser. Browser automation was unavailable during the 25 September 2026 debugging session.

For the changed controls, press Pause immediately after starting a journey, then press Play immediately after Pause. The final button choice should determine playback. Scroll vertically over a piano key while Quick Start runs: the sequence should stop and the chosen frequency should remain. After stopping normal playback, enable and disable Overtones: the wheel tones should return. Disabling Overtones while paused or stopped should preserve that transport state.

Playback scheduling uses a shared pause-aware clock; stopped sessions cancel their owned callbacks and audio nodes. Audio parameter updates cancel superseded automation as described in [MDN's AudioParam reference](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelScheduledValues). The worker refreshes app assets online and retains an offline copy following the [service-worker lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

Audio activation and suspension reconcile with the latest user request, since [Web Audio context transitions are asynchronous](https://www.w3.org/TR/webaudio/#dom-audiocontext-resume). Failures belonging to an earlier request cannot stop the current session. Worker cache version `nestorium-v7` includes microphone Sound Capture and retains the original design and debugging fixes. Online loading can continue when cache storage is unavailable.

## Microphone sound capture

Select Left wheel or Right wheel in Sound Capture, press Start listening, allow microphone access, and play an instrument near the microphone. Use singing bowls, tuning forks, chimes or other instruments with a clear, sustained tone. The selected wheel and piano position follow the detected tone silently. A steady pitch locks automatically after about 1.1 seconds of stable readings, following the analyser's initial buffer fill. Lock current tone can save a valid reading sooner. Let the first sound fade, select the other wheel, and repeat.

Play captured pair in stereo restores both saved pitches, unmutes the wheels, pans Left fully left and Right fully right, sets the mono mix to zero, and uses the existing Play/Pause/Stop controls. View piano reference scrolls to the keyboard, which includes the current wheel frequencies, nearest notes and interval. Captured values remain available while trying other app functions; Reset clears them. They are kept only for the current page session.

The detector measures the strongest sustained spectral component from 40 to 4,000 Hz, not necessarily the lowest mode or fundamental of an instrument. Complex or unpitched sounds may not produce a stable capture. It recreates those frequencies as sine tones, not recordings of the instrument's timbre. Intervals show the nearest equal-tempered name, actual ratio and cents, deviation from equal temperament, and frequency difference. Capture labels use the nearest note at A4 = 440 Hz. The existing piano fill still shows the continuous frequency position between keys.

The microphone requires a secure origin (HTTPS or localhost) and user permission, as documented by [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). Audio is processed locally using an unconnected [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API); no microphone audio is recorded, uploaded, or sent to speakers. Echo cancellation, noise suppression and automatic gain control are requested off. The browser may retain device processing according to its capabilities.

Analysis uses a 32,768-sample Blackman FFT with [quadratic interpolation of spectral peaks](https://www.dsprelated.com/freebooks/sasp/Quadratic_Interpolation_Spectral_Peaks.html). A level gate, clipping check and spectral concentration check reject silence, broadband noise and brief strikes; a stability window rejects changing pitches. Capture ends after 45 seconds without a lock. Cancel, Stop, Pause, Play, Reset, another activity, a channel change, Escape, hiding the page or leaving it release the microphone. Cancellation restores the uncommitted wheel preview; a direct wheel adjustment keeps the new user-selected value. Late permission grants are stopped immediately and cannot restart cancelled captures.

Automated detector tests render synthetic sinusoids and inharmonic mixtures through an independent FFT fixture at 44.1, 48 and 96 kHz. Tested single tones from 40.3 to 3,990 Hz stay within 0.15 Hz of the generated frequency. This is a synthetic test tolerance, not a hardware accuracy guarantee. Tests also cover noise, clipping, silence, pitch drift, exact and compound intervals, microphone permission failures, late grants/errors, interruptions, resource cleanup, two independent captures, piano highlights, and stereo replay.

Browser automation and real microphone access were unavailable for this implementation. Before publishing, test with actual instruments on desktop and mobile: verify both captures against a known reference tone, check that the strongest partial is the intended one, confirm the microphone indicator turns off after locking/cancelling, and listen to the left/right isolation through headphones. Inspect the new panel in light and dark themes at phone and desktop widths. Repeat after an offline reload to check the cached capture module.
