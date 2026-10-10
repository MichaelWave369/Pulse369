# Moon Rider research for Pulse 369

Upstream: https://github.com/supermedium/moonrider
License: MIT, copyright (c) 2018 Supermedium.

Moon Rider is a public WebXR rhythm title, written with A-Frame, JavaScript and Three.js. It has Ride, Punch, Classic (slice) and Viewer modes. The upstream package targets Node 11/12-era webpack and A-Frame; Pulse 369 runs React 19, Three.js, Vite/Vinext and Node 22. Importing Moon Rider wholesale would add old dependencies and duplicate Pulse's existing gameplay.

## Source-to-Pulse comparison

| Upstream module | Why it matters | Pulse v5 status | Next safe direction |
| --- | --- | --- | --- |
| `src/components/debug-controller.js` | Test VR interactions without performing a whole workout | Desktop lane keys available, but no standalone Quest QA page | This PR creates an isolated Quest Lab |
| `src/components/player-height.js` | Account for player height/reach | Seated shorter reaches already exist, but targets remain at authored heights | Future opt-in height calibration with range limits |
| `src/components/recenter.js` | Reorient the stage for a player | Pulse uses local-floor; no explicit recenter control | Add later with world-space and controller collision tests |
| `src/components/haptics-weapon.js` | Tactile feedback during interactions | Pulse already pulses controller on target hits | Check on Quest 3, add modern haptics fallback separately |
| `src/components/beat-generator.js` | Musical anticipation and spawning | Pulse already makes deterministic charts from BPM | Tune spawn lead-in and calibrated offsets |
| `src/components/zip-loader.js` | Import user-selected beatmap archives | Pulse currently imports MP3 and WAV | Consider a sandboxed optional note-map format; validate archives and provenance |

## Quest Lab experiment

A new `portal/quest.html` page contains **new original code, inspired by Moon Rider's debugging approach**. It does not copy Moon Rider's source, visuals, songs, beatmaps or assets.

The test requests `immersive-vr` using `local-floor`, displays a stationary grid and two hand targets, reads head and controller tracking, counts contacts in memory, and attempts optional haptic pulses. The Quest trigger or system menu exits. It makes **no API requests, saves no data, and does not connect** to the original Pulse app's Cloudflare backend.

### Manual acceptance on Meta Quest 3

1. Merge the PR and wait for GitHub Pages deployment.
2. Open `https://michaelwave369.github.io/Pulse369/quest.html` in Quest Browser over HTTPS.
3. Verify immersive WebXR is available and VR enters only after pressing the button.
4. Check both colored orbs, floor grid, and controllers; touch each orb gently and watch counters after exiting.
5. Press either trigger to exit; repeat entry, then exit through the Quest system menu.
6. Deny the permission once and verify a useful error appears.
7. Open on a desktop browser without VR; verify that it fails gracefully.
8. Test multiple rounds for stuck canvases, lost controllers, and WebGL memory issues.

The test is **not** a physics, collision-velocity, musical latency, exercise-form, physiological, or gameplay certification. A user can only confirm those through manual testing in the full v5 app.

## Licensing boundary

Moon Rider's MIT license permits source reuse with retained copyright and permission notice. This PR copies no Moon Rider code. If later contributions copy upstream code or assets, include the upstream full LICENSE and verify each asset's provenance. In particular, BeatSaver maps or tracks do not gain reuse rights merely because the Moon Rider game is MIT-licensed.

Issue #1 still blocks hosting the full Pulse backend publicly without replacing platform-specific trusted-identity assumptions.
