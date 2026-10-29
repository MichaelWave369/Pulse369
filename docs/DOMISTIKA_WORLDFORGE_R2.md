# Pulse369 × DomistikaXR · World Forge R2: Living Workout Stages

## Scope

R1 made a visual-only import and Quest preview in `world-forge.html`. R2 connects that **same validated WorldPack v1 and Three.js visual renderer** to the real Pulse369 workout stage (`app/studio.tsx` → `lib/game-engine.ts`).

The design remains local-first and scenery-only. Score calculation, canonical rhythm chart, target collisions, controller poses, session saves, clan membership and synchronized room starts are **not** modified.

## Use

1. Open DomistikaXR, make a workshop assembly and optionally attach Motion Forge effects / Beat Forge band assignments / Showrunner visual cues.
2. Export **Showpack v1 JSON** or workshop JSON; do not use the static GLB export for animation.
3. In the running, authenticated Pulse369 studio, under **Your session → Environment**, import the JSON into the new **World Forge · local world shelf**.
4. Choose the imported scene from the Environment selector. The stage visibly replaces the standard procedural world, while the real targets and coach keep their existing logic.
5. Choose the session mode and music, then start desktop training or use Quest's **Enter VR**. The custom scene runs as a decorative visual background with session-time-driven Showrunner cues and an approximate pulsing signal calculated from the selected song's BPM.
6. Use **Lower visual motion** to remove imported motion and glow effects while retaining static scenery.
7. Use **Export WorldPack** to retain a copy. Up to three validated scenes can be loaded **in this browser tab**. Reimport files next time. Removing a scene does not delete original downloads.

Do not interpret the synthetic visual pulses as analyzed live audio envelopes or beat-detected BPM. Imported scene content remains local to the tab; no user-generated scenery gets uploaded to Pulse369's server, added to session records or serialized in room configs.

## Runtime separation

- `portal/world-bridge.mjs`: single canonical validation/normalization for Domistika Showpacks, workshops and portable WorldPacks.
- `portal/world-bridge-three.mjs`: shared, deterministic Three.js material/geometry/motion visualization.
- `portal/world-stage-layout.mjs`: bound all authored geometry to <=24m width, <=12m height, <=12m depth; center the installed backdrop at z=-20 (approximately z=-14 or farther at rest), behind the original approaching targets at z=-8. Art remains visual-only; no collisions are registered.
- `lib/custom-workout-world.ts`: adapts validated visual instances to PulseGame's scene tree. It never gets a gameplay callback or score API. The authored scene remains read-only and receives time/BPM/reduced-motion flags only.
- `lib/game-engine.ts`: selectively hides/restores the four canonical worlds and disposes custom instances when changing worlds or unmounting. Collision checks continue to use only canonical target note meshes and hands.
- `app/studio.tsx`: client-memory world library and a local file picker/exporter. A room forces the native built-in world (no hidden peer divergence or unconsented file uploads). The `Config.world` field remains a canonical built-in ID.

## Safety and accessibility

- WorldPack parser rejects executable or unknown JSON keys, invalid schema/source names, NaNs, oversized files/meshes and out-of-range transforms **before** any world is selected.
- Strict 2.25 MB input limit, 2 MB workshop limit, 48 objects, 6,000 mesh triangles, max three local worlds per tab.
- Decorative world rendering uses its own geometry and cannot trigger collisions. Static authored geometry stays well beyond the scoring target approach corridor. Dynamic visual motions are bounded by the imported authoring contract but are **not** physical boundaries or collision objects.
- No artificial locomotion is introduced. The existing headset guardian and the user's cleared play area remain essential. A visual scene cannot replace Quest safety boundaries.
- Existing seated and calm options, voice cues, multiplayer and normal worlds remain available.
- Custom worlds in shared rooms are intentionally not supported in R2 to avoid distributing untrusted geometry to other clients.

## Verify

Run these locally or via a connected CI runner:

```sh
node --test portal/world-bridge.test.mjs portal/world-stage-layout.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm exec vite build --config portal/vite.config.ts
pnpm run build
```

The existing CI game-check script now explicitly tests the new WorldPack parser, scene fitting and room-config isolation. UI/headset acceptance still requires a person:

- Select each native environment, then a custom world, then return to a native environment.
- Import a real Domistika show, export/reimport, attempt malformed JSON and verify the live stage remains usable.
- Test Rave, Boxing, Qigong and Seated mode; verify the notes, HUD, coach, timing and score are unchanged.
- Import/remove three worlds. Confirm fourth import is blocked and reloading does not quietly persist private art.
- Start/leave a room, verify local imported scene is hidden and absent from room setup/session payload.
- Quest 3: play 5 minutes, pause/finish/exit; inspect headset frame rate, comfort, near-space boundaries and disposal.
- Lower visual motion: no dynamic sculpture motion or beats when enabled.

**Not in R2:** real decoded spectrum frequency-band synchronization, authoritative user-authored DanceFlow R10 cue binding, live multiuser world transfer, persistent online world catalog, collision-driven level scripting, 3D editing inside Pulse. These are separate future upgrades.
