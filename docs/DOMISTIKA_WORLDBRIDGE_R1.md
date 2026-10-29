# Pulse369 × DomistikaXR · WorldBridge R1

## What ships

A **local-only, visual-only** import/preview station in the public Pulse369 portal:

- `https://michaelwave369.github.io/Pulse369/world-forge.html` (after merge + Pages deployment)
- Reads exported `domistika.xr.showpack.v1` and `domistika.xr.workshop.v1` JSON from DomistikaXR.
- Converts either format into versioned `pulse369.worldpack.v1` JSON, exportable from the browser.
- Reconstructs authored primitives (box, sphere, cylinder, torus, knot tube), imported triangle meshes, position, rotation, scale, color, and X-mirror geometry in Three.js.
- Previews Showrunner cue palettes/visual energy and Motion Forge rest-pose spin, bob, orbit and pulse motion, with a **local synthetic** BPM visual signal and reduced-motion setting.
- Offers desktop WebGL preview plus optional Quest 3 `immersive-vr` visual preview, with direct user-activated WebXR session and `local-floor`.

## How to try it

1. Open [DomistikaXR](https://michaelwave369.github.io/Domistika/xr.html). In Spatial Workshop, create or import an editable assembly; add motion bands and a show if desired.
2. Choose **Export Showpack JSON** (or ordinary workshop JSON). This is the editable/source JSON, **not** the static GLB.
3. Open Pulse369 World Forge in a second tab. Use **IMPORT DOMISTIKA JSON** to choose the downloaded file; no server upload is performed.
4. Verify object count and visual cue name, then use **EXPORT WORLD PACK** to download portable `pulse369.worldpack.v1` JSON. You can reimport that JSON.
5. On Quest 3, open the Pulse369 World Forge page in Quest Browser and select **ENTER VR PREVIEW**. Use the headset's Exit VR or the page's Exit control to end the session. This is deliberately a stationary visual-only scene.

A built-in **Pulse Portal sample** with nine authored torus objects and three visual cues is supplied for testing the importer without first opening DomistikaXR.

## Boundary contracts

- **No gameplay yet:** Import never changes `lib/worlds.ts`, `lib/game-engine.ts`, Pulse369 scoring, authenticated sessions, target chart, dance timeline, workouts, server storage, or any connected account. This is the first interoperability demonstration, not a new workout world picker.
- **No actual music:** BPM is manually adjustable and drives a synthetic visual beat only. Neither audio clips nor real FFT/beat-grid tracking are imported. Domistika's Showrunner export itself is silent.
- **No locomotion/collisions:** The installation is offset so the closest authored surface begins approximately five meters in front of the player at its rest pose. Animation may move visually but never interacts with XR tracking, boundaries, targets or hits. Physical VR playtesting remains necessary.
- **Strict import:** 2.25 MB total file (JSON character ceiling), original workshop limits of 48 objects, 6,000 mesh triangles, 2 MB assembly, explicit geometry/property allowlists, finite coordinate bounds, duplicate-ID rejection and source/schema/version checks. Parse errors leave the previous world untouched.
- **No sources altered:** The original Domistika saved project and exports are read-only to the bridge. There is no cross-origin fetch, remote URL loader, microphone, camera, tracking recorder, cookies, persistence, analytics, or account API.
- **No untrusted script:** Imported JSON is mapped to known Three.js geometries/materials, not evaluated as expressions or HTML.
- **Compatibility:** WorldPack retains normalized Showpack workshop content and cue descriptions; it does not pretend to contain a GLB animation or executable user plugin.

## Verify

```bash
node --test portal/world-bridge.test.mjs
pnpm exec vite build --config portal/vite.config.ts
```

Manual desktop: upload a real Showpack from Domistika, verify 3D material/transform parity and visual timeline; export/reimport WorldPack; import corrupted JSON and ensure the previous preview survives; test reduced motion; keyboard-file picker accessibility; reload and confirm no implicit saved private data.

Manual Quest 3: enter/exit with both controllers, verify no camera jumps, verify stage stays outside reach, monitor steady FPS and comfort, deliberately pause/exit and return, repeat with a 48-object dense scene and with reduced motion enabled. Desktop or CI builds do **not** qualify Quest hardware.

## Follow-on rungs

R2: explicit level spawn/safe-zone and visual-only stage anchors, an approved world picker in the main Pulse369 gameplay runtime without moving scoring or gameplay physics.

R3: translate Domistika visual cues to Pulse369's existing authoritative local/shared audio clock (not fake BPM) and keep user consent / music-sharing permissions.

R4: optional game-specific decoration/world kits, asset optimization and community-distributed worldpack validation, with persistent canonical Domistika source backups.
