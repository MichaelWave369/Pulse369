# Pulse369 DanceFlow R2: Choreography Creator

**New route:** `/Pulse369/create.html`. Standalone, local-first choreography editor for authored eight-count sequences, complementing R0 DanceFlow and R1 Choreographer.

## What the creator does
- Compose **1–16** named eight-count phrases; repeat each **1–4** times (maximum 512 authored counts).
- Choose one of **24 existing movement cues** from the three original DanceFlow styles for each count, optionally mirror the left/right hand targets. Existing cues describe safe arm gestures, not full-body or leg tracking.
- Reorder, duplicate, rename, delete phrases; set manual **60–180 BPM** and **0–1000 ms offset**. Undo the last 40 edits (in browser memory only).
- Live stylized instructional figure and count-by-count **screen preview**. **No movement tracking or motion scoring** on this route.
- Optional locally decoded MP3/WAV under 24 MiB, with existing Quest Music Lab file preflight. Reject an audio file if it cannot cover the sequence at the selected BPM/offset. Audio remains in memory, stops on exit, and is **never embedded in choreography export**.
- Export a portable `*.danceflow.json` file, or import one under 64 KiB. JSON passes a strict v1 schema and bounded field validation. Unknown fields, audio, pose telemetry or private metadata are removed by an explicit allowlist. No backend, uploads, analytics, localStorage, cookies or accounts.

## Important limitations
- The in-browser instructor animates authored left/right hand targets. It does not know users' physical pose, footwork, balance, dance proficiency, health, calories or heart rate.
- Manual BPM and offset are not analyzed or confirmed against the song's real downbeats.
- Use an audio file you own or have rights to use. The creator is **not connected to** More Bounce Labs, SoundCloud, Suno, or external APIs. A downloaded song may be selected locally.
- Closing/reloading this page loses the current unsaved edits. Export JSON frequently.
- Do not treat browser/CI checks as real Quest 3 hardware validation. R0/R1 remain the existing experimental headset routes.

## Schema v1
```json
{
  "schema": "pulse369.choreography.v1",
  "title": "MY DANCEFLOW MIX",
  "bpm": 112,
  "offsetMs": 0,
  "phrases": [
    {
      "name": "OPENING GROOVE",
      "repeat": 1,
      "steps": [
        {"style":"groove","moveIndex":0,"mirror":false},
        {"style":"groove","moveIndex":1,"mirror":false},
        {"style":"groove","moveIndex":2,"mirror":false},
        {"style":"groove","moveIndex":3,"mirror":false},
        {"style":"groove","moveIndex":4,"mirror":false},
        {"style":"groove","moveIndex":5,"mirror":false},
        {"style":"groove","moveIndex":6,"mirror":false},
        {"style":"groove","moveIndex":7,"mirror":false}
      ]
    }
  ]
}
```

## Tests and QA
- `node --test portal/choreo-model.test.mjs` and original DanceFlow/Quest/music tests.
- Import a bad JSON file, oversized file, an invalid move index and an unsupported schema; ensure all are rejected without losing the active chart.
- Edit, mirror, duplicate and reorder, export then reimport; verify phrase order and left/right targets match.
- Preview with synthesized guide and local valid/invalid MP3/WAV; verify bad files never play and that stop frees the audio context.
- Verify reload removes unexported routine and audio; confirm the JSON contains no selected music, pose trails or health data.

## R1 Choreographer integration
The existing `/Pulse369/class.html` route also gains a separate local **LOAD ROUTINE JSON** picker:
- Import the same validated v1 chart exported from the Creator. The routine's authored BPM/offset are applied to the class, and the class's 3/5/10-minute duration remains selected separately.
- During LEARN, teach the first four and second four counts of the imported first phrase, then the full eight.
- During REHEARSE and DANCE, play the chart's full authored phrase/repeat order, looping over it to fill the selected class duration.
- WARM UP and COOL DOWN keep gentle built-in cues.
- Controller tracking remains the same optional experimental Quest behavior; the anonymous class receipt indicates `imported-local-chart`, never storing title, artist, audio bytes, identity or pose history. Screen-only movement is never scored.
- Clearing the routine restores built-in choreography. No charts persist across reloads, and no original account-backed app data is touched.

## Next opportunities
Custom transition animations, richer footwork instruction with clearly marked sensor limitations, and a full track-authoring timeline. Real Quest acceptance remains unverified.
