# DanceFlow R1: The Choreographer

**Prototype / hardware unverified.** This is a new static `/Pulse369/class.html` route alongside the merged R0 `dance.html`, without touching the original hosted authenticated VR app.

## Class structure
R1 has five authored segments: warm-up, learn, rehearse, dance, cooldown. Select 3, 5, or 10 minutes and 96/112/128 **manual BPM**. A pure class planner rounds to full eight-counts and describes every phase. A procedural instructor illustrates upper-body target positions in the desktop preview and Quest scene. Bodyweight shifts, footwork and movement style are optional instructions, not tracked motion. Rehearsal and dance segments alone count controller-near-target matches. No virtual instructor is a person or an imported mocap recording.

## Music and privacy
- Synthesized count guide is the default.
- Optional selected MP3/WAV under 24 MB is signature-checked and decoded locally using the existing `preflightLocalAudio` from Quest Music Lab. Re-selecting a file invalidates the previous audio buffer; no networking, uploads, account sync, third-party catalog or persistence.
- A whole-number manual BPM and manually adjusted 0–1000 ms beat offset control synchronization. No automatic BPM detection or claim of calibrated beat alignment.
- Reject songs too short for the entire selected class; a local song plays only within the active session; stop ends audio, frame animation and VR.
- In VR, music playback and controller-cue classification use **the same `AudioContext.currentTime`** reference. Synthesized click guidance is a frame-triggered basic guide and is not sub-frame calibrated.
- Sanitized `pulse369.danceflow-class.v1` receipts contain only aggregate class settings, counts, and an explicit `LOCAL_UNVERIFIED` origin. No filenames, audio content, pose traces, identities, unique device identifiers, health information or exact timestamps. Screen-only sessions score no movement.

## Important functional/safety boundaries
- WebXR motion comes from HMD and two hand controllers. Feet, hips, dance quality, cardio intensity and calorie count **cannot** be evaluated and must never be marketed as measured.
- Designed for in-place, comfortable-range movement. No spins, deep squats, jumps or locomotion are required; seated arm adaptations are available.
- No medically validated exercise prescription. Clear Guardian boundary and space; take a break for discomfort, dizziness or pain.
- No real Quest 3 session, tracking latency, song-output calibration or exercise efficacy is attested to by CI.

## Suggested real-device QA
1. Open `class.html` from HTTPS Quest Browser; test 3/5/10 minute plans and the five-stage progress diagram. Test the screen preview without a headset and verify movement matches are always zero.
2. Import known-valid and corrupt downloaded MP3/WAV files; test local preflight, malformed header rejection, too-short songs, wrong BPM/offset and invalid duration. Confirm no uploads or storage.
3. Enter WebXR with two controllers, test left/right and both-hand matching, safe head turns, headset boundary, and exiting by trigger and system menu. Verify controller disconnect does not count touches.
4. Verify phase transitions, automatic end, local audio stops on exit, repeat enter/exit, and stable frame rendering after repeated sessions.
5. Check seated comfort, reachable target positions and reduced motion tolerance. Verify no involuntary steps, spins, pain-inducing reaches or forced stretches.
6. Inspect copied receipt fields; do not claim movement form, fitness, calories, beats automatically inferred or real Quest acceptance.

## Tests
`node --test portal/dance-core.test.mjs portal/dance-class.test.mjs`
plus the full existing CI TypeScript, portal Vite, app/Worker, and Quest/music/QA checks.

## Next R2
- Richer dance phrase authoring: sequences, transitions, mirrored instructor poses, user-made routines.
- Licensed locally selected music timeline authoring and cue offset calibration tests.
- Adaptive breaks and intensity options; optional tracked full-body form only with appropriate hardware and explicit informed opt-in.
