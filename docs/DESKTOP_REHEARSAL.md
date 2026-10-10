# Pulse 369 Desktop Music Rehearsal

## Purpose

Test a 24-beat rhythm drill on a normal desktop/laptop browser without entering VR. This is a standalone **client-side diagnostic** that uses the same Web Audio clock-based scheduling/scoring helpers as the Quest Music Lab. It does not modify the full Pulse 369 workout engine, private music services, or account database.

After merge and Pages deployment: `https://michaelwave369.github.io/Pulse369/rehearsal.html`

## How to test

1. Open the page in desktop Chrome, Edge, or another browser with Web Audio support.
2. Choose an MP3 or WAV file that you have the rights to use (maximum 24 MB). It is decoded **locally**, before playing. No API, upload, storage, or telemetry occurs.
3. Enter a manually determined BPM (60–180) and optional beat offset in milliseconds (0–1000). The drill validates that the decoded song is long enough.
4. Press **Start 24-beat rehearsal**. After a short lead-in, the song plays at a moderate volume while two targets brighten alternately.
5. Press **A** for the left target and **L** for the right target on each expected beat. Onscreen buttons also work by clicking or tapping. Repeat-key presses are ignored; focus in input controls will not trigger scoring.
6. Stop early or let the sequence finish. The local report includes only aggregate errors and session duration. Optional copy is explicit.
7. Try an intentionally wrong BPM or offset. Those should change the observed alignment, but the app **does not estimate or verify the true musical downbeat**.
8. Test denied/unsupported audio, early exit, re-entry, empty hit reports, and invalid settings.

## Timing and measurement limits

- The music source and hit classification use one `AudioContext.currentTime` clock.
- An accepted hit must be within the shared authored timing window and on the correct side, with **one score per beat**.
- The hit clock corresponds to when a browser receives a keyboard/click event. It is **not** the true physical start of a finger motion and does not measure audiovisual latency, human reaction time, or VR controller motion.
- Laptop/desktop browser audio output latency varies, so signed error cannot be taken as an absolute device latency calibration.
- On completion, the report is tagged `pulse369.desktop-rehearsal.v1` rather than mislabeled as an immersive VR headset session.

## Privacy

The page contains no `fetch`, account login, uploads, analytics, or persistent storage. It does not include raw keystroke timestamps, file name, music content, user identity or biometric data in receipts. The selected audio buffer remains in page memory until replacement or page close. Results are only copied by deliberate user interaction.

## CI

`node --test portal/desktop-rhythm.test.mjs` exercises keyboard mapping, shared-beat scoring, wrong-hand rejection, lead-in boundaries, manual offset, empty result handling and receipt privacy. The existing GitHub Pages multi-page build includes `rehearsal.html`.

**Passing CI verifies compilation and pure scoring functions, not speaker timing or real input hardware.**
