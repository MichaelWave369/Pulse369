# Pulse369 DanceFlow R3: Motion Coach

**Rung:** Articulated procedural instructor and beat-synchronized interpolation. **Not** camera motion capture, skeletal tracking, real dance-form evaluation, or an automatic choreography generator.

## What changes

- Reuses the existing DanceFlow R0 movement targets, R1 class phases, and R2 portable JSON chart format. No chart schema change or re-export is needed.
- Adds `portal/motion-coach.mjs`, a deterministic renderer-independent model:
  - normalized virtual head, neck, shoulders, arms, elbows, wrists, torso, hips, knees, feet;
  - smooth interpolations between the current and next authored cues, keeping the current cue visible briefly before beginning a transition, arriving at the next pose at the next authored count;
  - small **cosmetic** rhythmic sway and bounce. The virtual feet are planted. This is not a user-footwork instruction.
  - **Reduced motion** option holds each counted pose without interpolation or decorative sway; the user still receives textual count and movement instructions.
- Adds a shared React SVG instructor used on both `create.html` and `class.html`, driven by the *existing local Web Audio clock* during class/song previews. The figure shows both arms and a stylized lower body, not just two floating hand markers.
- Replaces R1's original minimal Quest ghost avatar with a slightly articulated procedural avatar updated each animation frame using the same pure pose model. Existing **controller-to-target scoring is unchanged** and independent of the avatar art.
- Adds and runs unit tests for eased boundary continuity, deterministic frame stepping, mirroring, reduced motion, malformed/missing cue fallbacks and the final class beat.

## What stays unchanged

- The standalone R0 Quest rhythm / music labs, first-run gate and original authenticated Pulse369 application are not rehosted or modified.
- No users' face, torso, feet, hands, camera, health data or controller trajectories are recorded by this pose-animation module. The instructor is fully authored and can be computed offline.
- The R2 choreography JSON schema remains `pulse369.choreography.v1`, so older saved charts continue working. Neither music nor animation telemetry is placed into exported charts or aggregate privacy receipts.
- Optional locally chosen music stays on device; the manual BPM/offset and codec preflight rules remain.
- Real Quest 3 tests and physical safety/latency calibration are **still needed**. A green build or prerecorded demo is not hardware certification.

## Manual acceptance

1. On desktop, open `create.html` and select multiple first/middle/last counts. The whole instructor should show arms, elbows, torso and stationary feet, not just hand dots.
2. Start an authored preview at 96, 112 and 128 BPM. Check that wrists move smoothly toward upcoming pose before its count and do not visibly snap at the count boundary.
3. Mirror a left cue and check right-side visual changes. Test a rapid change in style and phrase transition.
4. Enable reduced motion, then preview. Confirm the instructor **holds** each pose rather than sliding/swaying, and count text still advances. Try keyboard-only navigation and screen reader labels.
5. Open `class.html`; test built-in and imported local chart, standing and seated modes. The same instructor appears in desktop and Quest.
6. In an actual Quest 3 headset, confirm the avatar remains a safe distance ahead, does not obstruct virtual cue rings or the headset boundary, and does not affect scoring of left/right/dual controller cues. Test repeated entry/exit.
7. Confirm unchanged `LOCAL_UNVERIFIED` class receipts and `SCREEN_DEMONSTRATION_UNVERIFIED` creator receipts. No pose traces or music fields may leak.

## Follow-on work

A genuinely fluent choreographer needs **authored full-body keyframes, advanced animation rigs, optional foot tracking with device-supported sensors, musical phrase transitions and expert dance review**. R3 intentionally stops at safe procedural illustration rather than pretending 2 controllers establish dance skill.
