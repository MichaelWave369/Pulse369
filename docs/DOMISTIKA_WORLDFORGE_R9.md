# World Forge R9 · Adaptive Visual Governor

R9 turns R7's **web browser callback pacing observation** into an **optional, reversible decorative-effect governor** for solo authored World Forge shows in immersive VR. The governor is *off by default*, keeps all state locally in memory, and never changes the user's authored R6 World Library bundle.

## Runtime contract

`portal/world-adaptive-governor.mjs` is a pure deterministic state machine with three levels:

| Level | Visual changes | Crossfade |
|---|---|---|
| 0 · Full authored visuals | 100% motion, glow, and signal strength | R5 policy, unchanged |
| 1 · Reduced visual effects | 65% motion, 70% glow, 80% reaction gain | R5 policy, unchanged |
| 2 · Minimal visual effects | 30% motion, 40% glow, 50% reaction gain | **Cut instead of a two-scene crossfade** |

R9 multiplies **only visual reaction parameters** in `PerformanceWorkoutWorld`; it does not disable a WorldPack's scene objects, alter the R5 procedural mesh detail, modify geometry budgets, change the underlying DanceFlow phrase timing, or interfere with hits, notes, camera, hand positions, audio playback, haptics, room messages, workout score, result serialization or stored JSON.

## Heuristic, not a certified headset profiler

The default pacing guard watches **60 consecutive WebXR animation callback intervals** while an authored performance is actually playing in immersive VR. A window is degraded when 20% or more of callback intervals exceed 27 ms, or its p90 interval exceeds 34 ms. Three consecutive poor windows and at least 4 seconds since the last adjustment allow exactly **one** downward step (maximum level 2). Recovery requires eight consecutive good windows, where at most 3% of intervals exceed 27 ms and the p90 is at most 22 ms, plus the 4-second adjustment cooldown. Only one upward step occurs per recovery period.

The design suppresses oscillation and one-off stutters. Gaps greater than 250 ms are counted locally but excluded from adaptation windows to avoid classifying headset pause/background suspension as GPU overload. On disabling the option, pausing the workout, leaving VR, or disposing the game, the effective tier returns to 0 and all original authored effects can resume. XR playback and standard R7 captures work independently: opting into R9 does **not** automatically start R7 receipt recording.

**These callback timing thresholds are heuristics, not device refresh-rate targets.** R9 cannot independently measure headset FPS, GPU work, late frames, native display refresh, reprojection, thermal throttling or VR comfort. Suppressing visual reactions is also not a guarantee of better performance: very dense meshes and fragment-heavy geometry may require renderer-level optimization or real Quest profiling.

## UI and permissions

`app/world-adaptive-governor.tsx` appears in the actual Pulse369 **Rave Performance Composer**, beside R7 Quest Acceptance and R8 Evidence Comparator. Users can explicitly check **Allow temporary, automatic reductions to optional VR world visuals**. It is disabled when no authored performance is available or a multiplayer room is active. R9 displays the current effect profile, whether immersive sampling is active, reductions/recoveries, recent p90 callback interval, proportion over 27 ms and ignored suspension gaps.

Measurements are transient **aggregate numbers only**. No sound recordings, content excerpts, hardware IDs, headset pose, account details, body movement, camera feed, controller velocity, audio identifiers or personal health data are collected. No storage, service worker, backend, API endpoint, telemetry upload, external SDK or new permission is added.

## Verification

```sh
node --test portal/world-adaptive-governor.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm run build
```

The pure tests assert: disabled by default; desktop callbacks ignored; stable immersive session preserves level 0; sustained slow frames climb only through levels 1 and 2; sustained recovery needs longer stable windows; suspension gaps and malformed times cannot force a downgrade; exiting VR, disabling and starting a new immersive session restore authored visual effects. The existing game CI harness now checks the same pure governor through the real game API and verifies that an authored 2-world R4 crossfade is reduced to a 1-world cut at tier 2 and restored at tier 0.

## Actual Quest 3 acceptance steps

1. Import a known R6 Domistika World Library performance in the real Quest Browser and ensure a compatible music track is selected.
2. Start a **R7** baseline with R9 **disabled**, play normally in immersive VR for 1–3 minutes including one authored crossfade, then export the R7 receipt.
3. Return to Studio, turn **R9 on** and enter immersive VR with the **same show and user settings**. Record another 1–3 minute R7 sample, including the same scene transitions.
4. Examine the R9 panel after exit for reductions, recoveries and rejected suspension gaps. The original WorldPack and Performance JSON must be byte-for-byte unchanged.
5. Open both R7 files in **R8 Quest Evidence Comparator** and explicitly declare matched conditions only when they truly match. The available metrics are callback pacing proxies, not native headset frame-rate validation.
6. Verify with your eyes and controllers: no target loss or shifted scoring timing, no music duplication, reduced effect intensity during bad pacing, no scene flicker or rapid governor tier oscillation, no adverse comfort, and full original visuals after disabling the governor.

## Explicit boundaries

- **Not a cloud optimization service.** Opt-in measurements and decisions remain in memory.
- **Not self-certified Quest compatibility.** Desktop CI provides synthetic tests only; physical headset acceptance is still required.
- **No automatic geometry decimation, pixel-density adjustment, or shader swap.** These might compromise the authored content or VR view and require dedicated acceptance and profiling.
- **R5 remains authoritative for visual scene geometry budgets.** At high pacing pressure R9 may conservatively choose a cut sooner; it cannot relax an R5 scene safety limit.
