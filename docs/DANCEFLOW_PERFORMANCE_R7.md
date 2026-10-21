# Pulse369 DanceFlow R7: Performance Studio

**Route:** `/Pulse369/performance.html` after the pull request has been merged and GitHub Pages has deployed.

## Why this exists

R2 authored dance gestures, R3/R4 added procedural stage movement and visual direction, R5 taught beginner steps, and R6 assembled session timelines. R7 combines these into a **stage rehearsal and art-direction tool** that animates existing authored routines on a virtual stage without promising video recording or live motion sensing.

## Workflow

1. Open Performance Studio. The default sample is the standard R6 House/Funk/Disco workout.
2. Use **Import Show / R2 / R6** to load any one of:
   - R2 `pulse369.choreography.v1` chart (up to 64 KiB)
   - R6 `pulse369.dance-workout.v1` recipe (up to 16 KiB)
   - R7 `pulse369.dance-performance.v1` show (up to 128 KiB)
3. Select a section on the timeline. Change its lighting between **Neon Royal, Aurora Floor, Amber Groove, and Twilight Calm**; adjust virtual framing, artistic movement expression, and reduced-motion settings.
4. Rehearse with **Web Audio synthesized count guide** or a locally decoded MP3/WAV using the same 24 MiB preflight as R1–R6. Manual BPM and offset come from the imported source; **no beat detection** or music analysis occurs. A too-short audio file is rejected before playback.
5. Enter **Theater Mode** for a larger stage presentation. During playback, the scene and instructor follow the authored beat clock. Upcoming scenes are previewed in the final eight counts of each section.
6. Use **Save Show JSON** to preserve your show title, full imported source and stage settings. Save explicitly: no account, cloud storage or background persistence.

## Model boundaries

`portal/dance-performance.mjs` normalizes imported JSON to a strict field allowlist. It maps:

- R2: validated eight-count phrases and repeats into a show timeline. Mirrored R2 gestures are preserved.
- R6: validated workout blocks (warm-up, dance, recovery, cooldown) into a show timeline. During dance blocks, arms follow the original Academy style's R0 authored gestures. During warm-up, recovery, and cooldown, neutral arms are used. **The full R6 footwork lesson text is not animated**. Its recipe still carries the settings through show export.
- Stage assignments: a small `{segment,stage}` list that changes the **appearance only**, never the original source's authored dance counts or controller scoring.

The R4 `sampleDirectedPose` animates the procedural torso, arms and planted-foot instructor. Visual scene washes and beams change only at section boundaries. Their decorative intensity is deliberately restrained: no strobe patterns, rapid flashing, and no external images or stage assets. **Reduced motion** disables interpolated gestures and dynamic lighting pulse.

A scene is a simulated performance, **not** a camera feed. R7 does not request the webcam, microphone, XR headset, body sensors, account information, uploads, network analytics or motion telemetry. Song buffers remain locally in memory and are released when stopped. The R7 show contains no audio bytes or reference to a selected local filename.

## What R7 does NOT do

- Record/export video, audio or screenshots.
- Capture a person, track actual movement or evaluate dance form.
- Remix or detect beats in selected audio.
- Turn R6 instructional footwork into accurate avatar foot tracking.
- Synchronize other connected devices or guarantee projector/Quest rendering.
- Validate workout completion, intensity, caloric burn or any physical outcome.

A local summary marked `SCREEN_DEMONSTRATION_UNVERIFIED` reports **displayed beats only** and anonymous show metadata, not the title, track, body traces or personal identity.

## Automated acceptance and manual testing

The new `portal/dance-performance.test.mjs` covers:

- Complete count coverage and recovery/cooldown for R6 sources.
- R2 multi-phrase/multi-repeat and mirrored gesture preservation.
- Scene overrides preserving timeline positions and valid upcoming scene notices.
- Finite/deterministic procedural pose continuity across stage transitions and reduced motion.
- R7, R2 and R6 import validation, strict field allowlisting and anonymous session summaries.

The original game/app tests, R0–R6 unit tests, TypeScript checks, browser/Worker builds and multipage Vite build remain in CI.

Human checks are necessary after merging:
- Load R2 and R6 files, save an R7 show, reload the browser and reimport the R7 show; verify its source, overrides, title, framing and motion controls match.
- Playback built-in and custom programs with guide click at 80, 96, 112 BPM or chart tempo; check stage changes and next-section notices match the existing count timeline.
- Test a locally downloaded MP3/WAV, reject short/oversized/malformed files, verify no file is uploaded. Leave and return during playback to make sure sound resources close.
- Check keyboard focus and mobile layout, Theater Mode exit, reduced motion, screen readers, and whether stage lighting causes discomfort.
- Do not claim browser recording or full-body motion capture exists. If video export is wanted later, implement a separate, opt-in, performance-tested recording pipeline with explicit output formats and permission handling.

## Follow-on

R8 could provide an **offline cue-sheet / show runner** with scene-presets, user-authored movement descriptions, more accessible stage alternatives and real browser acceptance reports. Full video export and VR hardware integration should remain separate acceptance gates.
