# World Forge R3 · Living Frequency (Pulse369 × DomistikaXR)

R3 connects the visual-only World Forge R2 stage to the **same decoded track currently being played by Pulse369**. It adds live FFT analysis, a world director for per-object response bands, an intensity control, pause-safe visual decay and a portable, music-free export. The existing single-source music path, canonical scoring and multiplayer contracts remain authoritative.

## What changed

- `lib/audio.ts` uses a browser-native `AnalyserNode` **inside** the existing graph, connected `AudioBufferSourceNode → AnalyserNode → GainNode → audio destination`. It does not start another source, enable a microphone, record, upload or persist audio. All volume operations still use the original gain.
- A pure helper (`portal/world-audio-frame.mjs`) reads and normalizes approximate bass (35–260 Hz), mids (260–2000 Hz), highs (2000–8000 Hz), full energy and positive bass-attack pulses. Its onset detector has an approximately 180 ms refractory interval and a short decay. These are visualization heuristics, not guaranteed exact beat detection, BPM, or source separation.
- Sampling is disabled until a valid local custom world is selected with **Live music FFT** active. Only while the canonical source is actually playing and the AudioContext is running does it read spectrum data. Pause, finish, cancel, no track, renderer error or native world selection yields zero live visual values. Smoothing prevents sudden bright steps.
- The existing `WorldPack v1` and DomistikaXR `motion.band` semantics remain the only art contracts. No forked model or server-side JSON migration. The display-only Three.js renderer receives bounded five-channel values. Gameplay collision, target timing, controller inputs, scoring, session records, room configs and peers never read or depend on the visual stream.
- The **World Director** controls are available when a locally imported world is selected in the main Pulse369 Studio:
  - **Live music FFT · local** (default): react to the actual playing track.
  - **Tempo simulation · preview**: use R2's deterministic, BPM-based approximation, explicitly labeled.
  - **Static · no moving effects**: calm, no dynamic sculpture motion or flashes.
  - **Reaction strength** (0–150%): bounded intensity of music-driven visual animation/glow. Actual source audio volume remains independent.
  - **Sculpture + response channel**: choose one imported object and Full spectrum, Bass, Mid, High, or Bass onset. Changes happen on validated clones while a session isn't playing and can be saved using existing **Export WorldPack**.
- Rave sessions preserve R2's *authored BPM/offset eight-count visual cue* timing; this is intentionally **not** inferred from FFT onset and does not pretend to import complete DanceFlow R10 documents.

## Try it

1. Export an editable Showpack v1 JSON from [DomistikaXR](https://michaelwave369.github.io/Domistika/xr.html).
2. Open the real Pulse369 Studio, import it through the local **World Forge shelf**, and select the imported world.
3. Choose **Live music FFT**; assign different sculptures to Bass, Mid, High and Bass onset. Choose a moderate reaction strength (try 50–70%) and use **Lower visual motion** if necessary.
4. Start a solo workout with one of Pulse369's demo tracks or a track you've already imported into your own studio. When the canonical audio plays, the sculptures react to its analyzed spectrum in memory.
5. Pause and verify the lights fade down, then resume, finish or exit VR. Switch to a default environment to disable sampling. Select tempo simulation to compare a synthetic R2 visual clock.
6. Export WorldPack. Open/reimport that file to verify it retains the object response assignments, Showrunner cue palette and authored motion, but contains **no audio files, FFT data, user sensor data or music track IDs**.

Imported scenes remain private to that tab, as in R2. **Shared rooms still use canonical native worlds only**, regardless of local director settings.

## Acceptance and safety

Automated:
```sh
node --test portal/world-audio-frame.test.mjs portal/world-director.test.mjs
node --test portal/world-bridge.test.mjs portal/world-stage-layout.test.mjs portal/world-visual-clock.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm exec vite build --config portal/vite.config.ts
pnpm run build
```

The existing CI `scripts/verify-game.mjs` includes R3 assertions for band analysis, routing to the original gain, silence on stop, world isolation and exportable per-object director changes. Standalone pure DSP tests also cover malformed frequency arrays, isolated frequency bands and transient gate behavior.

**Manual desktop:** Verify audible output is unchanged when enabling/disabling a custom world, audio stops and resumes, silent sections produce minimal or no light, bass vs high frequency tracks affect the intended objects, BPM preview remains distinctly synthetic and there is no extra API call triggered by analyzing audio.

**Quest 3 hardware:** Check several custom scenes in immersive VR, performance on dense 48-object scenes, no strobing or uncomfortable light jumps, pause/exiting restores visuals, and reduced-motion mode disables all animated effects. Compare an actual Domistika Showpack to the exported Pulse WorldPack and test malformed file rejection. Passing CI does **not** establish Quest 3 acceptance.

**Known limitations:** Browser Web Audio frequency analysis is approximate; low frequencies have limited resolution with a 2048-point FFT and bass-attack detection can miss fast or quiet beats. World Director only edits existing sculpture response-band metadata; it is not a full audio-reactive shader graph. There is no new third-party audio ingestion, microphone, cloud transmission, service account integration, shared visual spectrum sync, song-beat authoring, or DanceFlow R10 timeline file parser.

## Next rung

R4 can add optional signed/publisher-independent world bundles, richer staged visual cue maps linked to the *actual authored* DanceFlow timeline (not heuristic FFT onset), visual effect budgets, optimized geometry instancing and external acceptance evidence for Quest 3.
