# World Forge R4 · Performance Composer

R4 makes a bounded, local, authored **visual performance** out of existing DanceFlow choreography and DomistikaXR WorldPacks. It is not a new gameplay mode. The original Pulse369 target chart, scoring, audio routing, VR controls, room synchronization and persisted session contracts remain unchanged.

## What R4 implements

**Portable show format:** `pulse369.world-performance.v1` includes exactly one validated `pulse369.choreography.v1` chart, 1–3 complete and validated `pulse369.worldpack.v1` scenes, and one visual cue per authored phrase. Each cue selects a scene and has a palette, glow 0–1, motion 0–1, and a transition of 0, 2, 4 or 8 authored counts. File exports contain no recorded audio, account IDs, biometric data or gameplay results. Imported JSON is checked against a 6.85 MB cap, limits on worlds and objects, exact cue keys, and the existing DanceFlow/WorldBridge validators before use.

**DanceFlow sources:** The Composer accepts exported `pulse369.choreography.v1` files and chart-based `pulse369.dance-performance.v1` shows. This reuses the repo's already implemented DanceFlow portable authoring contract. Workout-only DanceFlow show sources and hypothetical newer R10-specific timeline formats are **not** silently guessed or accepted. Full R10 interop would need the actual verified schema.

**Composer UI in real Pulse369 Studio:** Import one to three WorldPacks into the existing local shelf. Under a **Rave** session, import an authored DanceFlow chart or a saved World Performance. Edit each phrase's scene/palette/glow/motion/transition, enable/disable the performance, then export the complete local show. A saved show can be reopened in another tab without separately uploading music or its scenes. All controls that change world authoring are disabled during a running workout or shared room.

**Real-world scene switching:** A `PerformanceWorkoutWorld` visual adapter samples the exact chart's BPM, offset, repeated phrases and wraparound counts using the existing session elapsed time. On a changed scene, it crossfades two safe display-only stages for the specified number of counts; otherwise one is resident. Unneeded Three.js geometry/materials are disposed, scene roots stay behind the scoring-target corridor, and the headset and game camera never jump. At most **two** authored worlds render at a time (up to 96 objects and up to 12,000 mesh triangles before primitive tessellation). The third is not loaded until its phrase starts.

**Visual direction:** Each phrase overrides palette, glow and geometry-motion multiplier in the shared R1–R3 renderer. Both staged worlds use the original R3 local FFT frame from the active song. Global World Director intensity, static and reduced-motion settings remain respected. Visual glow is clamped and smoothed rather than strobed. No new music source, microphone, server upload, controller tracking, gameplay target or collision mesh is created.

## Use it

1. In DomistikaXR, create/export 1–3 workshop or Showpack JSON worlds. Import them into Pulse369's R2 World Forge local shelf.
2. In DanceFlow, export an **authored choreography chart** (`pulse369.choreography.v1`). A chart-based `pulse369.dance-performance.v1` export works as well.
3. Switch Pulse369's studio to a solo **Rave** workout. Choose a track with the same BPM as the authored chart. (R4 will warn if the BPMs differ, but it does not retime the game.)
4. Use **Performance Composer → Import DanceFlow choreography**. Each phrase gets a scene assignment by default; change scenes/palettes/glow/motion and the 0/2/4/8-count transition as desired.
5. Enable **Use authored performance**, start the workout or enter immersive VR. The world show loops in authored phrase order while the original session's note chart and hit scoring remain untouched.
6. Export **World Performance** to a local JSON file and reimport it to resume in a later session. Switching back to the original Environment disables the composer; shared rooms use canonical native scenery only.

## Automated tests

```sh
node --test portal/world-performance.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm exec vite build --config portal/vite.config.ts
pnpm run build
```

The existing game CI harness now additionally asserts: a chart + two scenes can roundtrip, authored 8-count transition boundaries and fade progress are deterministic, editing a cue is immutable, only one or two scene instances are resident, and all scene resources are released. The standalone tests cover repeated phrases, offset, looping, validation and chart-only DanceFlow import. CI should still run the full existing workout/Worker/VR checks.

## Quest 3 manual acceptance

- Import an actual DomistikaXR Showpack and a real DanceFlow authored chart. Verify the scene and cue events correspond to the expected phrases and no scoring records change.
- Use two visually distinct worlds and a 4-count crossfade; pause/resume at a boundary and verify no visible pop or lingering scene.
- Test a 48-object WorldPack with music-reactive motion, both Quest 3 and desktop, inspect frame rates and VR comfort.
- Activate **Lower visual motion** and static mode: all authored movement and beat-driven glow should cease. Verify controls, Guardian, room tracking and readable targets remain unchanged.
- Exit VR, reenter, reset performance, switch to a native environment and import a saved show. Confirm no app/API uploads, leaked audio graph or GPU objects.
- Reject malicious/malformed JSON and oversized shows; verify that the last valid in-memory selection stays intact.

## Limitations / honest boundary

R4 does not parse a new DanceFlow R10 schema, transfer scenery to peers, persist to a cloud show gallery, author physical VR collisions, automatically optimize polygons, guarantee 72/90 Hz headset performance, or time-stretch songs. It uses the **existing chart's authored BPM and offset** to schedule scenery while Pulse369's own gameplay clock independently governs notes. Imported 3D primitives can have far more tessellated triangles than the **mesh-only** validator counts, so hardware profiling remains essential before calling the crossfade truly optimized for Quest.
