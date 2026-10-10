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

## Quest Lab v2: heading/reach calibration and diagnostic receipt

The Quest Lab now uses a small pure geometry module (`portal/quest-math.mjs`) to place the two contact rings **relative to the tracked headset's horizontal facing**, instead of fixed room origin. Target heights use bounded estimates from head position, not inferred body size or medical measurements. Choose standing or seated before entering.

Controls in VR:
- **Grip squeeze** on either supported controller: re-center both test rings relative to the headset's current position and horizontal direction.
- **Either trigger**: exit the headset test. The Quest system menu can also exit.
- Move gently and stay in place. Do not overreach; choose seated reach if needed.

After exit, an optional **Copy QA receipt** control gives a minimized JSON summary containing only test mode, maximum number of controllers detected, left/right touch counts, explicit recenter count and elapsed seconds. It omits raw headset coordinates, head height, IP address, account identifiers, music information and unique device IDs. It is **never automatically uploaded**.

`node --test portal/quest-math.test.mjs` runs deterministic geometry and receipt tests without a headset; CI runs these as well.

### Additional real-device checks

1. Open the Quest Lab while facing a different direction than the room's reference orientation; the rings should still appear directly ahead.
2. Repeat in seated mode, and check that targets are lower and a little closer together.
3. Rotate your body slightly, squeeze a controller grip and confirm the rings appear in front of your new heading. The recenter count should increase.
4. On exit, copy the receipt and confirm it does not include raw head/controller positions, IDs, or personal data.
5. Check haptics if present, but do not fail the test if a headset does not support controller vibration.
6. Repeat multiple enter/exit cycles for WebGL cleanup and stable controller state.

These changes are not yet measured on physical Quest hardware. Headset height is displayed locally only and does not become part of the shared receipt.

## Quest Lab v3: visual rhythm-entry timing (proposed PR #5)

The isolated public Quest Lab now offers **Free touch** and optional **Visual rhythm (24 beats)** modes with a selectable **90 or 120 BPM**. Rhythm mode schedules 24 alternating left/right visual cues from one monotonic browser clock after a short lead-in.

- Cue rings brighten shortly before the authored beat. Enter a highlighted ring gently with the **matching controller** and leave it before the next cue.
- Only the first correct-hand ring-entry within **±220 ms** of each expected beat is counted. A wrong-hand touch, early/late entry outside the window, or second hit on the same beat does not score. This is a deliberately simple timing drill, not a game difficulty or physical-reaction assessment.
- On exit, the anonymous receipt includes **aggregate** accepted touches, mean absolute authored-beat error, signed median error, and early/late/on-beat counts. Empty samples produce `null` error metrics rather than invented precision.
- No audio is played, no Suno track is requested, and per-touch event timestamps, raw controller poses, head height, headset identity, account data and music metadata are excluded from the receipt.
- The visual beat is calculated against the browser's frame clock. **This does not measure input-device latency, audiovisual synchronization, physical reaction time, or music onset accuracy.** Real hardware acceptance remains necessary.

### Quest 3 check

1. Choose standing/seated, then Visual rhythm at 90 BPM before entering.
2. Use the grip to recenter targets and verify rings are in front of the headset.
3. Look for 24 alternating ring cues. Enter the highlighted target on the beat with the corresponding controller; leave it between cues.
4. Test a deliberately wrong hand and an early touch outside the cue window. Neither should count.
5. Exit with the trigger, copy the receipt, and inspect that it contains only aggregate metrics and **no individual touch timestamps**.
6. Retry at 120 BPM. Confirm neither mode affects the original full Pulse 369 workout engine or uploaded music.
7. Repeat entering/exiting to check browser performance and WebXR cleanup.

Pure scheduling tests run in CI via `node --test portal/quest-rhythm.test.mjs`.
