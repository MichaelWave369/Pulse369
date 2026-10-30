# World Forge R11 · Immersive Art Showcase

R11 introduces a **separate non-workout art gallery** for validated DomistikaXR scenes embedded in a local R4/R6 World Performance. It is a deliberate bridge toward a future Silicon Louvre exhibition experience, not a claim that Silicon Louvre itself has been integrated, and not a hosted art marketplace.

## What is built

- **Private curated exhibition** from 1–3 validated existing WorldPack scenes in the selected R4 World Performance. The `portal/world-showcase.mjs` model produces a bounded manifest and pure deterministic visitor movement. No new file format is created and no data is persisted or uploaded.
- **One room's artwork is loaded at a time**, implemented in `lib/showcase-world.ts` using the existing R1/R2 Three.js `CustomWorkoutWorld` renderer. Changing rooms or crossing desktop/WebXR rendering tiers disposes the previous artwork's GPU resources before allocating the next room. Scenes retain their authored geometry and optional motion, with no audio-driven intensity input. Default motion is **off** for visual comfort.
- Each room includes a simple architectural floor, side walls, a discreet pedestal and local text plaque. Navigation is slow and bounded (maximum .85 meters per second, within a small gallery area) and has **no collision system**. Sculptures are *not* solid gameplay physics; visitors must pay attention to personal physical space.
- **Desktop**: activate the gallery in the existing Pulse369 Studio, click the stage to move keyboard focus away from buttons, walk with WASD and rotate using Left/Right arrow keys. Choose a room from the gallery panel. Escape exits the desktop gallery.
- **Quest Browser**: press **Enter gallery in VR · no workout** from an actual user action. The same `PulseGame.renderer.xr` handles the immersive session, so there is **no competing second WebGL/XR renderer**. Move slowly using the left-controller thumbstick relative to head direction, physically turn in a cleared tracked space, and use left/right controller triggers to switch artworks. Use the headset browser's native Exit VR control when finished. The room floor is visual only and does not modify tracking origin or guardian.
- Gallery entry is allowed **only while idle/finished** and without a multiplayer room; it never starts the normal `PulseGame.start()` workout. It does **not** start music, decode songs, create notes, accept target collisions, award points, persist workout history, upload files or change game state to `playing`. Trying to start a normal workout in an immersive gallery is rejected until gallery VR has been exited. Starting a standard workout from desktop closes the gallery first.
- Existing World Performance, DomistikaXR WorldPack, R5 geometry budgets, R9 governor, R10 director, R7/R8 evidence tools, audio and session records are unchanged. When the gallery exits, the normal game environment becomes visible again.

## How to use it

1. Open the actual **Pulse369 Studio**, select solo Rave and load or create an existing authored R4 World Performance, including one from the R6 private World Performance Library.
2. Below the R10 Experience Director, choose **Immersive Art Showcase · R11** and select **Open local art gallery**. Your real stage becomes a framed art-viewing room without starting scoring.
3. On desktop, explore the piece using WASD and look left/right with arrow keys. Use the exhibit list or Previous/Next room buttons. Turning on subtle authored sculpture motion is optional and only affects the visual installation.
4. With Quest 3 in a clear physical space, press **Enter gallery in VR · no workout**. Browser user activation is preserved when requesting the immersive session. Head tracking remains the platform's normal WebXR tracking; thumbstick locomotion is limited and can be avoided entirely by standing in place and changing exhibits.
5. Use either controller's trigger to move between exhibits. The gallery always holds one authored scene at a time and rebuilds lower-detail R5 Quest-style geometry upon immersive entry.
6. Exit gallery VR using the Quest browser's own exit control, then select **Close gallery** to return to the standard studio. The authored show and user music remain unchanged.

## Technical boundaries and safety

- Browser-based gallery locomotion has **no physical collision, obstacle avoidance, guardian overrides, teleport arcs, controller snap-turn, ownership metadata or multiplayer networking**. If those are needed, they warrant a separate reviewed rung.
- VR controller buttons and movement are tested in automation only through pure navigation logic and engine API gates; **actual controller handedness, thumbstick mapping, positioning, room comfort, performance and label legibility must be tested on Quest 3**. The VR gallery mode is not claimed as hardware certified.
- Quest GPU cost and browser callback timing have R5–R9 caveats. Dynamic imported meshes can still be too heavy; the gallery shows a per-scene estimated Quest warning, and real headset profiling remains essential.
- The gallery is a private display of art that the current client loaded, not an uploaded public gallery. R6 creators decide whether and how to distribute portable bundle files. R11 does not validate legal authorship or reuse rights.

## Tests

```sh
node --test portal/world-showcase.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm run build
```

The CI suite covers validated manifest derivation, pure bounded visitor navigation and room switching, invalid input rejection, the actual `PulseGame` exhibition APIs, refusal to transition gallery state during a real workout, and World Performance source immutability. Dedicated gallery model tests are run in GitHub Actions alongside the existing R1–R10 game, portal and Worker suites.

## Acceptance before broader publishing

Perform a manual Quest 3 test on a **real authored DomistikaXR bundle**: verify the artwork orientation, curated room plaque, 1–3 room switching with both triggers, slow thumbstick movement, absence of workout HUD and notes, no score or music session created, exit/re-entry without orphan GPU objects, and comfortable navigation in a clear physical playspace. If something fails, correct the gallery before expanding it into a multi-room connected Silicon Louvre-style museum.
