# DanceFlow R8: Show Runner

## Mission

Build on the merged R7 **Performance Studio** without changing the existing portable `pulse369.dance-performance.v1` show schema. R8 introduces reusable **visual-only stage presets**, an original printable **cue sheet**, and rehearsal transport that follows the same Web Audio clock as the authored stage animation.

Route: `/Pulse369/performance.html` (the existing R7 route is enhanced in place).

## Stage presets

A new, separate `pulse369.stage-preset.v1` JSON schema stores:
- Validated display name, 1–32 stage-theme identifiers, virtual framing, artistic expression, and reduced-motion setting.
- No choreography, user data, song/audio bytes, sensor tracking, account info, health estimates, filenames, performance receipts or upload endpoints.

Three curated looks are built in: **Neon Royal Live**, **Twilight Sessions** (reduced motion), and **Amber House Party**. Apply any visual look to an existing show without disturbing its R2/R6 source, count timing, or stage boundaries.

**Save My Stage Preset** captures current section looks (up to 32 sections) and display settings. **Load Stage Preset** validates a maximum 8 KiB JSON and applies to the current show; on a shorter/different show, theme slots cycle deterministically. For shows longer than 32 sections, the saved 32-theme pattern is repeated. Existing R7 full-show import/export remains backward compatible.

## Section-focused rehearsal controls

**Full Show** starts the authored show at count zero, including a local soundtrack's original manual beat offset. **Rehearse Selected Section** begins at the first beat of the highlighted section.

- Synth guide starts at that beat without replaying earlier counts.
- If local MP3/WAV is selected, the local `AudioBufferSourceNode` starts at the equivalent absolute song offset, calculated with the authored BPM and manual offset.
- Playback uses `AudioContext.currentTime` for both displayed beats and audio. Pause/resume suspends/resumes that **same** context, avoiding an independent wall-clock source that would drift.
- Stop and component teardown release the current audio source and context. The original audio preflight/length validation remains.
- Local display receipts count beats **displayed by that rehearsal**, not imaginary earlier performance if the user started mid-show. The timeline display still shows the absolute authored count. Receipts remain `SCREEN_DEMONSTRATION_UNVERIFIED` and do not measure dancing or fitness.

Stage transport pause/resume and stop remain accessible in theater view.

## Human-readable cue sheets

The integrated R8 cue sheet derives from **the exact normalized R7 show**. It lists each section's:
- Cue number, source start/end count, scene name, stage palette, relative soundtrack time including authored offset, and time-in-show.
- R6 warm-up, recovery and cooldown are preserved; R2 mirror and repeat settings remain in original choreography.

**Export TXT** writes a local human-readable text file; **Print Cue Sheet** uses CSS to print a paper-friendly table, without capturing the virtual stage or generating video/PDF. The cue sheet and show title are from user-authored data; no audio or live observations appear. The synthetic count guide begins counting immediately and may differ from song-offset times. Users must manually calibrate their selected audio, because there is **no** beat detection.

## Safety and boundaries

R8 is a **scripted display controller**. There is no camera, microphone recording, AI movement scoring, measured footwork, physiological intensity or calories, synced physical lighting console, live controller feed, remote song upload, or export of performance video/audio.

Reduced-motion stage design stays opt-in and uses static instructor count cues; stage color themes are bounded. Physical headset/projection acceptance, browser print acceptance and actual musical beat calibration still require human checks.

## QA

`portal/dance-show-runner.test.mjs` exercises:
1. Old R7 show schema remains unchanged and usable.
2. All built-in and user presets round-trip in the strict visual-only preset format.
3. Preset scenes map deterministically across R2/R6 sections without shifting chronology or recovery breaks.
4. Cue-sheet rows are contiguous, align with R7 source timings and respect BPM/offset.
5. Starting from later sections computes a correct local music seek point; synth guide has no song offset.
6. Untrusted or oversized preset JSON is rejected; private fields are discarded.
7. CI still runs R0–R7, TypeScript, game, Worker and Vite portal checks.

**Manual browser acceptance checklist:** import a custom R2 chart with repeated and mirrored phrases; apply preset, save it, import into another show, verify all poses/section times. Start local audio from section 2, pause, resume and stop; check sync while returning from theater. Print the cue sheet on mobile/desktop and inspect page breaks. Test reduced motion and keyboard focus. Record real QA evidence before calling headset or show-production acceptance complete.

## Next possibilities

R9 could add a user-authored segment annotation layer with carefully normalized accessibility-safe descriptions, stage run-of-show metadata and better offline browser acceptance gates. Real capture/export or VR sensors must remain independent, explicit and tested features.
