# World Forge R7 · Quest Acceptance Lab

R7 adds a **user-triggered headset acceptance recorder** to the actual Pulse369 Studio. It is intended to answer: "Can I transfer a real R6 World Library bundle to Quest Browser, load and play it with the existing R4/R5 renderer, and capture honest, reproducible browser-side evidence about what happened?"

R7 is a measurement-and-acceptance rung, not a claim of confirmed Quest 3 compatibility or frame-rate certification. It preserves R1–R6 WorldPack, World Performance, portable bundles, private IndexedDB library, visual-stage safety limits, original workout scoring, original Web Audio stream, multiplayer rooms, and session data.

## Real instrumented path

- `portal/world-acceptance.mjs`: opt-in, capped **7,200-frame** callback interval recorder. It operates entirely in memory and samples only when `xrPresenting === true` and capture was explicitly armed. No background monitoring.
- `lib/game-engine.ts`: after an existing `renderer.render(scene,camera)` call, with a real current `PerformanceWorkoutWorld`, reads only the WebGLRenderer's publicly exposed `info.render.calls/triangles` counters and the PerformanceWorld's scene index, resident stage count, and transition reason. It passes only these bounded numbers plus the animation-loop timestamp to the recorder. **No controller positions, body pose, hand contacts, camera views, audio samples, track IDs, names, device identifiers, account data or gameplay score** are sampled or serialized.
- `lib/performance-workout-world.ts`: exposes a cheap read-only `getFrameTelemetry()` metadata snapshot without recalculating its more expensive geometric budget report each frame.
- `app/world-acceptance-lab.tsx`: a panel in the **actual Rave Composer**, next to the private R6 World Performance Library. Users can explicitly **Start opt-in XR capture**, **Stop capture**, review a local numeric summary, mark six *self-attested* test items, and **Download evidence JSON**. A capture stops automatically when the XR session exits; the in-memory measurements remain available to download until the panel is remounted/closed.
- The recorded file has schema `pulse369.quest-acceptance-receipt.v1`; it includes only numerical callback/gap/scene information and six manual checkboxes. It labels itself **USER_ATTESTED_ONLY_NOT_INDEPENDENTLY_VERIFIED**, never PASS, certified, or Quest 3 measured refresh.

## Diagnostics and limitations

- Browser callbacks: sample count, duration, median and p95 callback interval, estimated animation callback cadence in Hz. Callback pacing **is not** GPU rendering time, visible frame-rate verification, compositor presentation timing, reprojection detection, or Quest 3 native refresh rate. For valid intervals, gaps over 250ms are counted as **long interruptions** and excluded from percentile calculations. Up to 7,200 recent valid intervals are retained; the receipt includes only aggregate summaries, not raw timestamps or frame streams.
- Scene render estimates: peak Three.js draw calls and rendered triangles from the renderer's statistics; observed authored phrase changes and Quest crossfade-to-cut events. These are not GPU time or physical comfort metrics.
- **Basic review sufficiency** requires at least 180 actual XR callback samples spanning 15 seconds. This only indicates enough data to begin reviewing and is not a performance pass threshold.
- The manual checklist is deliberately **not auto-verified**. It is impossible for software to independently infer whether a user experienced nausea, controller comfort, accurate sound reaction, or correct visual choreography from this telemetry.

## Desktop → Quest 3 manual protocol

1. On a desktop browser, load a DomistikaXR WorldPack or R6 World Library bundle, create a DanceFlow performance and **Download shareable bundle**. Save a second copy as a backup. Confirm no music tracks are embedded in the exported JSON.
2. Transfer the saved `.json` file to Quest by a method you explicitly choose. The app does **not** automatically upload or relay bundle data.
3. Open the actual Pulse369 Studio in Quest Browser, choose **Rave**, import the R6 JSON bundle via the existing **World Performance Library**, and enable the authored performance.
4. Review the R5 geometry preflight. Select **Live music FFT**, not **Tempo simulation**, if evaluating music-reactive scenery. Choose a demo or already available track. Avoid obstructed physical space.
5. In **Quest Acceptance Lab · R7**, press **Start opt-in XR capture** before **Enter VR**. Use the game normally for more than 15 seconds, ideally several minutes for varied scene boundaries. End or exit VR: capture stops automatically and returns you to the Studio.
6. Review observed callback intervals, gap counts, peak draw calls/triangles, scene changes, and budget-cut events. Then mark only the checklist items **you personally observed**, leave others unchecked.
7. Press **Download evidence JSON**. Repeat the run with low-motion and different geometry to compare. No receipt is sent to Pulse369, GitHub or third parties automatically.
8. Record separately any **actual headset FPS / dropped-frame/reprojection measurement** acquired from a trusted headset profiling tool. Do not relabel callback cadence as native FPS.

## Automated checks and manual boundary

```sh
node --test portal/world-acceptance.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm run build
```

Tests verify explicit opt-in, no desktop false evidence, bounded XR callbacks, deterministic percentile/sufficiency calculations, interruption accounting, transcript-limited receipt, game lifecycle API, and self-attested checklist validation. No tests claim to run on Quest hardware.

## Next rung

If headset evidence supports the design, R8 could add optional browser-side saved reports, local comparison between captures, and targeted optimization of the most expensive authored geometry or material path. Any browser-generated evidence remains user-supplied and must be distinguished from independently witnessed measurements. No untrusted files can execute code or alter game scoring.
