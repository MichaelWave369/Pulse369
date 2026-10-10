# Pulse 369: Quest Local Music Lab

This is a **separate, public, browser-only diagnostic**, not the full Pulse 369 application.

## What it does

- Open `https://michaelwave369.github.io/Pulse369/music.html` on a Quest 3 in Quest Browser (after the PR merges and Pages finishes deploying).
- Select your own downloaded **MP3 or WAV under 24 MB**. The browser checks the signature and decodes the selected file using Web Audio, locally. It never calls the Suno API, fetches a soundtrack, or uploads your audio.
- Set the song's tempo (60–180 BPM) and beat offset (0–1000 ms) **manually**. Adjusting them may be necessary even for songs reported as 120 BPM, because intros and downbeats vary.
- Pick seated/standing targets, enter VR, and practice 24 alternating visual beats while the local audio plays. Squeeze a controller grip to recenter, or press trigger/system menu to end. The drill ends on its own after the last beat.
- Audio playback and beat checks use the **same Web Audio clock** (`AudioContext.currentTime`). This avoids relying on a free-running animation frame timestamp to schedule music, but **does not calibrate audio output latency, display latency, Quest sensor processing, or the actual first musical beat**.
- After VR exits, optional anonymous JSON reports contain only mode, touches, recenter count, duration, manually chosen tempo/offset and aggregate timing stats. No audio bytes, song title, filename, size, account, biometric data, raw movement or per-hit timestamps are included. Reports are never transmitted without the user explicitly copying them.

## Privacy, licenses, and scope

- No analytics, telemetry, storage, HTTP API or backend access is coded into this page.
- The music is decoded locally in the browser's memory and released when the WebXR session closes. The React file selector keeps its selection until changed or page reload.
- **Only use music you have rights to download and use.** An MIT license for the Moon Rider game does not license BeatSaver music or any Suno output. This experiment copies no Moon Rider assets or code.
- This app is not a medical device, form detector, rhythm-game certification, or a full Pulse workout. Exercise in a clear play area at a safe volume.
- Full Pulse 369 backend still requires standalone authentication modernization (issue #1).

## Technical validation

`node --test portal/quest-local-music.test.mjs` checks file signatures, size, BPM and offset validation, shared audio clock alignment, 24-note boundaries, and wrong-hand hit rejection. GitHub CI builds the public pages and continues running existing backend, gameplay and Quest tests.

## Manual Quest 3 acceptance checklist

1. On desktop Chrome, verify no VR support is represented truthfully and file selection never uploads anything.
2. On Quest Browser, select a short local MP3 and verify error handling, then a valid >25s MP3 and a WAV.
3. Open WebXR. Confirm the song starts after the short lead-in; visual cues alternate left/right with the local audio.
4. Verify touch feedback and timing counts when entering and leaving each ring, including wrong-hand rejection.
5. Exit via either trigger, grip recenter, Quest system exit, and automatic 24-beat completion.
6. Check the anonymous report excludes filenames, audio, head height and raw timestamps.
7. Re-enter with a different track, 90/120/150 BPM and altered offset, to see the effect on timing.
8. Use seated mode. Keep movements gentle and stop if uncomfortable.

**Hardware validation is pending until somebody actually runs this on a headset.** A green GitHub build demonstrates that the software compiles and deterministic tests pass, not that Quest speakers/controller tracking are synchronized.
