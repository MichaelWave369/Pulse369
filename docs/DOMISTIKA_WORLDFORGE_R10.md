# World Forge R10 · Immersive Experience Director

R10 turns the merged R1–R9 DomistikaXR → DanceFlow → Pulse369 integration into an **actual creator-controlled performance launch and silent rehearsal workflow**. It lives inside the canonical Pulse369 Studio, immediately above the R9 adaptive governor and R7/R8 Quest acceptance tools. It does **not** fork or replace the workout engine or change the portable R4 World Performance / R6 World Library bundle schemas.

## Creator experience

1. In Pulse369 Studio select solo **Rave**, import or reopen an existing DanceFlow World Performance and enable the authored performance (R4/R6).
2. Open **Immersive Experience Director · R10**. It displays a derived cue sheet with each phrase's name, scene title, count start/end, seconds, palette, and crossfade duration. Timing comes directly from the validated DanceFlow chart's **actual BPM, offset, repetitions and phrase sequence**. The director reports the R5 Quest geometry estimate and whether the currently selected song's BPM matches the authored chart.
3. Check **Enable silent visual rehearsal on the existing stage**. Use Play/Pause, the seek slider, Return to Start, or tap individual phrases. The existing Three.js PerformanceWorld responds directly to the rehearsal cursor. The preview uses zero audio-frequency input: **it does not play, upload, decode, record or synthesize music**. It does not create targets or publish workout/session results.
4. When ready, press **Enter the authored show in VR** if WebXR is available. This invokes the **existing** Pulse369 `enterVR` flow, which starts the normal solo workout, authoritative song playback, notes and scoring. Launch explicitly **disables the rehearsal clock** before invoking the existing VR session flow. Existing R5 Quest budgets, R9 optional governor, R7 opt-in acceptance recorder, R8 evidence comparator and normal hand controls continue unchanged.
5. To evaluate the full headset experience, record the session using R7, then compare like-for-like R7 receipts in R8. **Browser callback pacing is not a verified native headset FPS measurement**.

## Design and safety

- `portal/world-experience-director.mjs`: deterministic derived cue-sheet and read-only preview sampling over the R4 schema; preflight that warns about BPM mismatch and expensive Quest scenes without rewriting files. A pure local browser-callback rehearsal clock has explicit enable, seek, play, pause and stop; it loops at the authored duration. Callback stalls greater than 250 ms stop rehearsal rather than jump the timeline.
- `lib/game-engine.ts`: R10 rehearsal methods are gated to idle/finished, desktop, authored-show-only states. The existing renderer reads the preview cursor for **visual scenery only**. The canonical session timer, `makeChart`, `collect`, hits, health, room messages, audio and result fields never read the rehearsal clock. Starting the normal workout resets the preview automatically; the R4 renderer's realtime source remains unchanged while playing.
- `lib/performance-workout-world.ts`: exposes validated authored duration to the game for correct visual rehearsal bounds; R5/R9 scene policies remain authoritative.
- `app/world-experience-director.tsx`: a small interactive authoring panel with semantic buttons and explicit consent for preview. No automatic backend calls or downloads.
- No new external API, account, cloud service, persistence, new asset type or permission. Rehearsal remains **local and ephemeral**: the R6 exported World Performance bundle remains identical before and after preview.

**Rehearsal is a silent world-scene preview, not a separate full simulation of gameplay or sound.** With no active track, authored sculpture motion still follows its programmed timeline; music-reactive FFT glow requires actually playing a song through the existing normal session path. A VR launch is still a real workout, with normal target scoring and possible normal session history. R10 does not offer free-roam spectator mode in the headset or independently measure frame rate.

## Automated verification

```sh
node --test portal/world-experience-director.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm run build
```

- Authored cue-sheet count and repeated phrase boundaries; visual cursor correctly identifies phrase scenes.
- Song-vs-chart BPM mismatch warnings and heavy-world Quest preflight.
- Silent preview clock pause, seek, loop, reset and rejection of invalid cursor values.
- Canonical `PulseGame` API refuses rehearsal control while a session is live.
- Visual rehearsal cannot mutate source World Performance or replace workout scoring.
- Existing R1–R9 game and Worker verification remains green.

## Quest 3 acceptance

On an actual Quest 3, import your real DomistikaXR artwork and authored DanceFlow bundle. Verify the R10 cue sheet's scene order and BPM warning. On desktop, use silent rehearsal to skip to a 4-count crossfade and inspect placement. Next enter VR with the same show; confirm that the standard soundtrack and scoring work and that the Quest scene policy respects R5/R9 visual limits. Exit VR and confirm no orphan rehearsal clock continues. Record a real 1–3 minute R7 receipt, and compare with a second capture through R8 under matched conditions. Only a real headset run can establish practical Quest usability and comfort.
