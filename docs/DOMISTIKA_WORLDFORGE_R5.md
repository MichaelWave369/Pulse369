# World Forge R5 · Quest Performance Guard

**Intent:** Make the merged R4 DanceFlow Performance Composer safer to run in immersive VR by enforcing geometry-aware, opt-in **visual** quality and transition budgets. This is an optimization and evidence rung, not a new game mechanic, security claim, or 72/90 FPS certification.

## What changed

- **Estimate the actual geometry that the browser renders.** `portal/world-render-budget.mjs` counts a conservative triangle cost for the geometry produced by the built-in Three.js primitives (box/sphere/cylinder/torus/torus knot) plus the actual imported mesh triangle count. R4's validation budget counted only imported mesh triangles and ignored procedural geometry tessellation; R5 closes that blind spot for its performance decisions.
- **Two rendering tiers.** The Composer continues using full desktop geometry. When `renderer.xr.isPresenting` becomes true, the Composer invalidates/disposes active authored stages, then reconstructs them with lighter Quest-specific subdivisions: spheres 12×10, cylinders 12 segments, toruses 16×6, knots 40×6. The original WorldPack JSON remains unmodified.
- **Guard transitions before allocation.** In Quest quality, a requested crossfade renders two stages only when total estimated triangles are at most 32,000, estimated mesh draw calls at most 64, and each stage has at most 30,000 estimated triangles. Otherwise the transition becomes an instant visual cut, destroying the old stage **before** allocating the new one. The desktop tier has a more generous budget and retains the authored smooth transition when within it.
- **Visible preflight.** The real Pulse369 Studio composer reports maximum estimated single-world Quest triangle cost, number of transitions whose crossfades would be replaced by cuts and warnings for high-cost individual stages. This is an estimate based on renderer primitives, **not** a measured frame rate.
- **No score/audio/room changes.** All decisions are confined to Domistika scenery. Pulse369 retains its original rhythm chart, movement collisions, haptics, camera, controller interaction, soundtrack output, workout record, and multiplayer room contract. Audio FFT logic from R3 and authored DanceFlow cue timing from R4 are retained.
- **No new storage or network.** Nothing is uploaded, persisted, or captured, and existing portable show exports remain usable.

## Tests

```sh
node --test portal/world-render-budget.test.mjs
node --test portal/world-performance.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm exec vite build --config portal/vite.config.ts
pnpm run build
```

The preexisting CI game checks gain assertions for geometry/draw estimates, deterministic cut-vs-crossfade selection, 1-stage Quest fallback, desktop restoration and resource disposal. Pure Node tests specifically cover 48-object torus-knot scenes, invalid tiers/meshes and Quest vs desktop decisions.

## What to test on Quest 3

1. Export and import an authentic dense DomistikaXR scene and an authored DanceFlow chart; enable Composer mode in a solo Rave session.
2. Verify that the Studio warns about any costly transitions **before entering VR**.
3. Enter immersive VR; watch the scene switch at the authored boundary. A pair of high-cost knot scenes should **cut** rather than load/render both at once. A pair of light scenes should still blend.
4. Ensure the original target lanes, coaches, haptics, HUD, sound playback and combo scoring continue unaffected.
5. Leave immersive VR, return to desktop, and confirm the full geometry/crossfade is restored without ghost sculptures, UI loss, or retained GPU materials.
6. Test pause/resume, lower visual motion, headset guardian and 5+ minutes of sustained performance while observing the headset's actual frame timing.
7. Verify saved R4 show JSON still reimports; geometry quality is a **runtime rendering choice**, not a change to portable artwork.

## Known limits

This is a **static per-world geometry estimate**, not a GPU time, memory, thermal, bandwidth or FPS measurement. A small triangle count can still be costly because of materials/overdraw, and a large imported mesh can exceed the suggested single-scene limit even after primitive simplification. R5 conservatively **warns** about a too-heavy single scene but does not decimate user-supplied mesh data automatically (to avoid corrupting artwork). It downgrades only crossfades. Standalone R2 single-world previews remain on their existing rendering path; R5's XR tier and transition guard apply specifically to the authored R4 **Performance Composer**. Full device telemetry, adaptive frame-rate based LOD and optional true geometry decimation are later rungs.
