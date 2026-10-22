# DanceFlow R9: Timeline Composer

**URL after merge/deployment:** `/Pulse369/timeline.html`

## Purpose

Combine existing R2 dance hand-gesture charts, R6 workout intervals, R7 authored stage scenes, and R8 cue notes into an interactive, locally edited visual timeline. This adds a non-destructive companion document, rather than migrating all prior formats or altering a working session engine.

### Three aligned tracks
1. **Movements:** named R2 eight-count phrases and repeats, or read-only R6 warm-up, dance, recovery, and cooldown sections.
2. **Stage looks:** one of the R7 authored palettes per source section, with deterministic beat boundaries.
3. **Director notes:** optional plain-text notes, maximum 240 characters, associated with section identities when phrases move.

Each track shares a manual BPM and offset ruler; it does not analyze any audio file or draw a fake waveform. Click a section and scrub the exact authored count with a labeled procedural skeleton preview.

### R2 choreography editing

For an imported **R2 chart**, select a phrase to edit its display name, repeat count, whole-phrase style, individual one-of-eight gesture style/movement index/mirror flag. Reorder, duplicate, insert or delete whole phrases (maximum 16), keeping phrase-associated stage look and director note attached to the original phrase. Copying a phrase duplicates its original gesture data/stage look but deliberately starts with a blank director note.

R9 **does not support reordering individual beats with drag-and-drop**. It offers explicit, keyboard-accessible movement operations and an eight-count editor. The R2 movement targets remain **hand-only authored cues**, never claimed to be body tracking or authentic lower-body motion.

For **R6 workouts**, the generated progression and timing remain controlled by Workout Builder. R9 lets users annotate and stage those generated blocks but cannot arbitrarily reorder cooldown/recovery. Edit the R6 playlist in its existing builder.

### File contract and R8 handoff

- **R9 editing document:** `pulse369.dance-timeline.v1`, containing a normalized complete **R7** show and allowlisted `[{segment,text}]` director annotations. 128 KiB import limit; duplicate note indices, out-of-range segments, oversized notes and malformed JSON rejected.
- **Export R7 Performance Show:** a fully compatible **R7 v1 show JSON** (stages and choreography preserved; R9 notes omitted because the old R7 schema has no notes field).
- **Export Cue Sheet:** local plain-text director cue list with source count numbers, timestamp from manually selected BPM/offset, stage and note.
- **Import R2/R6/R7/R9:** R2 choreography charts and R6 workout recipes are validated in their own existing parsers before being wrapped in an R7 show; an R7 show wraps in an R9 editing document; saved R9 files restore authored notes. All imports remain **local** and do not upload files.
- **R8 Performance Studio import:** additionally accepts R9 JSON, deliberately extracts only the R7 show to run it; R9 director notes stay in the R9 editor/cue sheet. No ad-hoc state sharing, network service, localStorage, or claim of persistence without explicit export.

### Provenance and privacy

All stage lights, dancers and gestures are procedural **scripted displays**. No camera, pose estimation, observed steps, automatic beat matching, exercise evaluation, tracked sound, audio/video capture or server use. The local timeline document and cue sheet may include the author's chosen **title and text notes** and are exported only by pressing the explicit buttons. There are no receipts of physical movement.

### Automated verification

`portal/dance-timeline.test.mjs` runs in the unchanged full Pulse369 CI. Tests ensure:
- Legacy R7 show format stays identical, with separately normalized R9 notes.
- Moved R2 phrases carry along the correct notes and stage lighting.
- Duplicated/inserted/deleted phrases do not misattribute notes.
- Editing one exact hand count leaves its seven neighbors unchanged.
- R6 workout interval sequencing is read-only while notes and lighting remain editable.
- Cue sheet count/time coverage and BPM math close exactly.
- Imported JSON is bounded, allowlisted and rejects malformed or private fields.

### Browser acceptance checklist (not yet completed)

1. Import R2 chart, rename/repeat/edit/mirror a single hand cue. Move its phrase earlier/later. Confirm matching note and stage follow.
2. Duplicate/insert/delete phrases; check stage/notes and saved file still round-trip correctly.
3. Import R6 workout, check warm-up/recovery/cooldown remain intact and move buttons are absent.
4. Export R9 document, reload page, reimport and verify editor state. Export R7 show, import into R8 Studio, confirm the movements and stage look but **not** unsupported R9 notes.
5. Confirm timing ruler includes manual BPM and offset; verify there is no suggested beat detection.
6. Keyboard tab navigation, horizontal scroll, mobile layout, screen-reader labeling and reduced-motion checks.
7. Validate no song/camera input, network upload, video recording or biometric evaluation occurs.

**Follow-on ideas:** reversible editing history, true authored *per-count* visual note lanes, local media waveform display only with explicit file selection, accessible clip drag handles with keyboard equivalents, and separate opt-in video rendering if technically validated.
