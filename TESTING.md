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

The checks do not render a browser layout or generate real audio. Before publishing, inspect the desktop and phone layouts, listen to both headphone channels, check touch dragging and the volume sliders, and verify installation and offline reload in a browser. Browser access was unavailable during this debugging session.

Playback scheduling uses a shared pause-aware clock; stopped sessions cancel their owned callbacks and audio nodes. Audio parameter updates cancel superseded automation as described in [MDN's AudioParam reference](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelScheduledValues). The worker refreshes app assets online and retains an offline copy following the [service-worker lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).
