# Pulse369 DanceFlow R0: experimental choreography lab

**Status: SOFTWARE PROTOTYPE. Quest hardware behavior unverified. No full-body tracking.**

This isolated static route at `/Pulse369/dance.html` adds three authored eight-count routines to the public GitHub Pages diagnostic portal. It **does not** modify or rehost the original access-controlled fitness application, Cloudflare D1/R2, music assets, progression or user profiles.

## Behavior
- Styles: Neon Groove, Funk Circuit, Cosmic Disco.
- 96, 112, 128 BPM; 64 authored counts (8 eight-count phrases), three-second lead-in.
- On-screen 16-count choreography guide works without VR and **does not score movement**.
- WebXR immersive-vr uses local-floor head pose for near-field targets, left/right controller-grip positions, and a synthesized low-volume count pulse. Controller trigger or headset system menu ends the session.
- Positions for left/right/two-hand cues are head-relative so seated users can follow the **arm adaptation**. Footwork is described as optional gentle in-place weight shifts; feet, torso, heart rate, calories and dance quality are NOT tracked or inferred.
- At most one match per count, with a ±260 ms timing window and 28 cm approximate target radius. These are authored teaching thresholds, **not** calibrated timing/accuracy measurements.
- Anonymous, memory-only `pulse369.danceflow-r0.v1` summary includes only style/tempo/adaptation/counts/hand-cue matches, explicitly `LOCAL_UNVERIFIED`. No raw poses, song files, personal details, timestamps, tracking traces, account, analytics, network upload or persistent storage.
- Audio is a synthetic timing pulse only. Connecting permitted local MP3/WAV tracks from the separate Music Lab is future work and must retain its existing preflight and privacy protections.

## Manual headset acceptance (not yet executed)
1. Confirm play space, headset Guardian / safe boundary, and a safe stationary or supported seated position. Do not test near furniture or pets.
2. From HTTPS Quest Browser open `/Pulse369/dance.html`. Preview two phrases on-screen, check keyboard/screen controls and style/tempo selection.
3. For each posture, enter Quest VR with two controllers. Confirm local-floor session, left and right cue mapping, reach comfort, stable scene when head turns, and visible neon targets.
4. Verify wrong-hand, missing-controller, off-target and off-beat movements never count as correct. Check single-count scoring, both-hand cues, and no score for unsupported body parts.
5. Verify 64-count automatic end, trigger exit, headset system-menu exit, and repeated enter/exit without WebGL/audio leaks.
6. Confirm audio can be heard at a comfortable level and works without music/network permissions. If audio is unavailable, visual cues must continue.
7. Confirm all receipt fields are allowlisted and clear on reload. Capture failures as **manual reports**, never label a simulator or CI run as a Quest pass.
8. Confirm reduced-motion comfortable use (no spins, forced deep bends or required locomotion). Stop on dizziness, pain or tracking glitches.

## CI
`node --test portal/dance-core.test.mjs` tests authored ranges, cue timing, dual-hand matching and sanitized receipt provenance. Portal Vite build includes `dance.html`. Passing CI verifies source logic/build only, **not physical VR safety, dance instruction quality, or headset functionality**.

## Next rungs
- Licensed/local-only songs using the existing Music Lab preflight; beat-grid authoring rather than pretending to detect BPM reliably.
- Longer instructor-led warm-up / learn / rehearse / dance / cool-down playlists with clear rests.
- Optional upper-body motion trails and qualitative choreography feedback, without fake whole-body precision.
- Full-body accuracy only if explicitly supported by an actual calibrated tracker or consenting opt-in computer-vision system; no raw biometrics in receipts.
