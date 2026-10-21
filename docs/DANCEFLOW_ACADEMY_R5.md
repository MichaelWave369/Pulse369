# Pulse369 DanceFlow R5: Dance Academy

## Purpose
Introduce original **human-readable beginner dance technique instruction** while preserving the safety, authorship, privacy and actual-sensor boundaries of R0–R4.

Public GitHub Pages route: `/Pulse369/academy.html`.

## Three eight-count lessons

1. **House · Step Touch:** gentle, in-place side step and toe touch. Seated adaptation teaches alternating toe taps and arm rhythm.
2. **Funk · Bounce & Pop:** soft-knee or optional arm pulse, controlled forearm pops and tiny heel touches. Seated adaptation never requires squats.
3. **Disco · Point & Step:** small stationary side taps, diagonal forearm pointing and release; seated version uses toe taps without body rotation.

Each technique has **eight original, explicit count-by-count instructions**, named cue, human-readable standing instruction, seated alternative, tip, highlighted side, and relative illustrative diagram shoe positions.

### Safety
The diagram is a **fictional teaching illustration**, not measured feet or body tracking. It is bounded inside a stationary space: no turns, spins, jumps, wide steps or locomotion. No forced positions or exercise targets. A user may simply watch. Instructions request stopping for pain, dizziness, or instability and following their real headset safety boundary if later used in VR.

## Practice progression
Select **80 / 96 / 112 manual BPM**, **2 / 4 / 6 minutes**, and standing/seated. The local Web Audio click and `AudioContext.currentTime` clock drive these stages:

- **WARM UP:** 16 counts of optional gentle movement
- **FIRST FOUR:** repeat technique counts 1–4, 16 counts
- **SECOND FOUR:** repeat technique counts 5–8, 16 counts
- **PUT IT TOGETHER:** repeat the complete eight, 16 counts
- **DANCE IT:** repeat full eight for remaining time
- **COOL DOWN:** 16 counts of optional comfortable motion

The screen-only UI has count cards for manual inspection, a 2D in-place shoe diagram, explicit standing/seated descriptions, optional sound cue, reduced-animation toggle and no movement scoring.

## Existing editor bridge
"Export compatible routine JSON" creates a validated `pulse369.choreography.v1` chart containing a standard eight-count **hand-cue style**. This JSON can be imported in `create.html` and subsequently `class.html`.

**Limitation:** the v1 file format contains **only hand-movement chart cues**, not the Academy's footwork positions or instructional notes. No misleading persistence of leg choreography is implied. The Academy provides the footwork teaching, while creator/class still run existing hand-only choreography. A future, reviewed schema migration could integrate safe annotated technique semantics.

## Privacy and provenance
No account, webcam, uploaded music, network call, body telemetry, foot tracking, fitness evaluation, heart rate, calories, steps counted or biometric data. The optional local receipt `pulse369.academy-practice.v1` includes only which lesson/tempo/duration/posture was displayed and the number of displayed counts, explicitly marked `SCREEN_DEMONSTRATION_UNVERIFIED`. Screen practice **cannot** establish actual dance performance or fitness benefit.

## Verification
- New `portal/dance-academy.test.mjs` validates 3 lesson vocabularies, bounds on diagram positions, 2/4/6-minute exact phase partitions at all BPM choices, seated neutral placement, count mapping, R2 JSON portability and strict privacy allowlists.
- Existing choreography, dance-class, music and provenance tests remain in CI with multi-page Vite build.
- Manually test phone and desktop keyboard focus, screen readers, reduced-motion setting, audio permission denial and stopping mid-session. Check browser reload never restores private state.
- Any actual WebXR or full-body technique coaching would require explicit supported hardware, consent, independent safety reviews and **real Quest test evidence**. This page currently does not request WebXR.

## Follow-on
If we want authentic **dance workouts** beyond stationary beginner cues, build a curated library with expert dance review, technique descriptions across genres, structured progression, hydration/rest breaks and accessible seated variants. Do not imply the two-controller Quest setup validates real foot placement or dance quality.
