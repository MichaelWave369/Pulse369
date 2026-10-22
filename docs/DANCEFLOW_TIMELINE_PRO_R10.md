# DanceFlow R10: Timeline Pro

**Existing route enhanced:** `/Pulse369/timeline.html`, after merging and GitHub Pages deployment.

R10 adds bounded **Undo / Redo**, authored **per-count director annotations**, accessible phrase movement, and a clearer **eight-count musical ruler** to the merged R9 Timeline Composer.

## Editing history

- The composer retains up to **40** validated past snapshots of the complete editing document in browser memory, including R2 movement arrangements, R7 stage palettes, R9 director notes, and R10 beat notes.
- **Undo** and **Redo** work through toolbar buttons. When focus is outside text fields: Ctrl/Cmd+Z for undo, Ctrl/Cmd+Shift+Z or Ctrl+Y for redo.
- In text inputs and textareas, the browser's native text undo behavior is left intact. Each valid text edit can also be reversed through toolbar history. Repeating the same unchanged value does not create a new snapshot.
- A new import or Reset opens a fresh editing history. There is **no automatic localStorage, IndexedDB, cookie, account or cloud persistence**. Save your work explicitly.
- The redo branch clears when a new edit is authored after undo, like a standard editor.

## Per-count annotations and eight-count ruler

- Notes are attached to one selected **R2 eight-count slot** or one local count in an R6 generated section. Each note is max **120 plain-text characters**, with max **96** annotations per R10 document.
- When an R2 phrase repeats, an annotation for its slot applies to that same count in each repeat. The note does not claim to be a live observation of dancing.
- **Move** a phrase: its note and stage look move with it. **Duplicate** or **insert**: the new phrase begins with no extra private notes. **Delete**: its notes disappear. Existing other phrase notes are remapped.
- Per-count notes are shown in the cue sheet and marked on each R2 eight-count editing button.
- The ruler displays repeating eight-count markers from **manually authored BPM and offset**. It does **not** decode an audio waveform, detect musical beats, or analyze a private recording.
- Keyboard users can focus an R2 movement clip and press **Alt + Left / Right** to move it one phrase. The existing Move Earlier / Move Later buttons remain fully supported.
- R6 workout intervals stay read-only for choreography movement, protecting their warm-ups, recoveries and cooldowns, while allowing appearance and notes.

## Format contracts

| Export/import | What it preserves | What it intentionally omits |
| --- | --- | --- |
| **R10** `pulse369.dance-timeline-pro.v1` | Embedded full R9 editing document (including R7 show), section notes and R10 per-count notes | Music/audio bytes, recordings, accounts, sensor data |
| **R9** `pulse369.dance-timeline.v1` | Existing R9 show + section notes | R10 per-count notes |
| **R7** `pulse369.dance-performance.v1` | Original R2/R6 source choreography and stage settings for rehearsal/playback | All R9/R10 editing notes |
| **Text cue sheet** | Original R9 timeline and extra R10 per-count notes | Song waveform/audio or performer data |

The original R2/R6/R7/R9 JSON parsers and exported contracts are unchanged. `timeline.html` accepts existing R2, R6, R7, R9, and new R10 files. `performance.html` (R8 Show Runner) now also accepts R10 files but **extracts the embedded R7 show only**. It does not interpret or play text notes, which are editorial rehearsal reminders.

All imports are bounded and normalized through allowlisted fields, rejecting unsupported values, duplicate beat notes, out-of-range count indices and oversized documents (R10 max 128 KiB).

## Provenance and physical safety

This is a **local, scripted movement editing tool**, not a dancer tracker or dance-scoring system. Procedural instructors represent authored hand cues, not physical foot movements or measured body positions. No live recording, user microphone, camera, heartbeat, calories, movement quality or personal fitness information is collected. Local text exports can contain notes and titles a user writes deliberately, so inspect before sharing them.

## Automated tests

`portal/dance-timeline-pro.test.mjs` verifies:
- R9-to-R10 migration without modifying the old source show.
- Strict R10 import normalization and discarded private or unexpected properties.
- Per-count note bounds, uniqueness, validation and deletion.
- Correct annotation/stage movement on R2 phrase reorder, duplication, insertion, deletion and repeat changes.
- R6 count specificity and protected workout arrangement.
- Exact snapshot undo/redo, history cap, redo clearing on new edits and no-op suppression.

Full prior R0–R9 CI remains in place. Build and unit checks do **not** replace live-browser accessibility, keyboard, export/import and musical alignment acceptance. Before presenting R10 as production-ready, manually validate those behaviors on desktop/mobile browsers and ensure R8 still runs R10-exported R7 shows.

## Next steps

Potential R11: optional local-only waveform display **from a user-selected, consented music file** rather than a fabricated beat visualization, an explicit view of repeated notes on every phrase repetition, and tracked manual browser acceptance evidence. True body tracking/video capture would be an independent opt-in capability with its own verification.
