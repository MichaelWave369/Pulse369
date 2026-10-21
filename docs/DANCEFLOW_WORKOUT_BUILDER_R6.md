# Pulse369 DanceFlow R6: Workout Builder

**New public route:** `/Pulse369/workout.html`

A local-first way to assemble structured **screen-guided** dance sessions from the existing beginner Academy technique library. This is an instructional program, not a validated fitness product or any form of physiological tracking.

## What you can build

- A named **1–6 lesson playlist**, with House Step-Touch, Funk Bounce & Pop and Disco Point & Step, including duplicates and reordering.
- **6, 9, or 12 minutes**, manually set **80, 96, or 112 BPM**, standing/seated version, and an **Easy** or **Steady** comfort option. The comfort option changes guidance text only; it is **not** a physiological intensity recommendation or an exercise score.
- **Warm-up**: 32 gentle counts; **dance blocks**: up to 32 counts each; a **16-count recovery** after each pair of dance blocks when there is time for another full block; **cooldown**: 32 counts. The schedule is deterministic, contiguous and derived exclusively from the user's chosen BPM/duration.
- The playlist cycles to fill the chosen session duration. The teaching floor shows small, stationary optional foot placements, with a neutral illustrated foot position whenever seated, warming up, recovering or cooling down.
- Count-by-count textual guidance, progress, a scrollable timeline, upcoming section announcements, and synthesized guide audio or **locally selected MP3/WAV** up to the existing 24 MiB preflight limit. Audio is decoded in browser memory using existing local-music verification, never uploaded. A manual 0–1000 ms beat offset can account for song intros; no audio analysis is implied.
- An opt-in reduced-motion view removes shoe position transitions. No spins, jumps, deep bends or forced footwork are required. The session can be stopped at any point.

## Save your setup

The **Save Workout Recipe** button exports a portable `pulse369.dance-workout.v1` JSON file containing only the workout title, BPM, duration, pace choice, standing/seated choice, manual offset and technique playlist. **Load Saved Workout** validates that JSON (16 KiB max), rejects unsupported identifiers/ranges and **discards all other fields**. No browser persistence or account is used, so export the recipe before closing the tab.

**Separate hand-cue export:** The **Export R2 Hand-Cue Chart** button creates a fully compatible `pulse369.choreography.v1` file that can be imported into `create.html` and `class.html`. This file includes original eight-count hand cues for each selected lesson. It does **not** preserve the custom workout's footwork diagrams, recovery breaks, session duration or seated lesson instructions; those semantics remain only in the Workout Builder's recipe and Academy lesson library. The two formats have deliberately different purposes.

## Privacy, provenance and important limitations

- There is **no motion sensing** in the R6 page. No actual steps, movement quality, exertion, calories, heart rate or workout completion can be determined. `displayedCounts` describes *how much of the guided demonstration was displayed*, not what the user performed.
- A local receipt marked `SCREEN_DEMONSTRATION_UNVERIFIED` includes only bounded aggregate schedule information and the number of displayed counts. No song name, bytes, file path, body traces, workout title or personal identifier is included.
- There is no new cloud dependency, networking, authentication, analytics, camera, VR permission, or new reliance on headset hardware. The original hosted authenticated app is untouched.
- The Workout Builder is **not** a substitute for a human dance teacher, trainer, medical clearance or real-space safety practices. Use stable seating and stop for discomfort, dizziness or instability.

## Test plan

Automated `portal/dance-workout.test.mjs` verifies all BPM × duration × posture combinations for exact coverage, recovery placement and safe cues; bounded playlist operations; strict import/export normalization and schema compatibility; soundtrack duration guard; and the anonymous display-only receipt. The Vite multipage build and all prior Pulse369 tests remain on CI.

Human browser acceptance required before calling this a production-ready workout experience:
1. Add, duplicate, move, change and remove lesson sections, including the six-section cap and one-section floor.
2. Export recipe, reload, import recipe, confirm chosen workout name, order, BPM, duration, posture and offset are restored, with no audio or private fields.
3. Preview each playlist slot by selecting its row. Start/stop 6-, 9- and 12-minute sessions, including seated and reduced-motion options, verifying that recovery and cooldown advance correctly.
4. Select a locally downloaded authorized MP3/WAV of sufficient duration, confirm it plays without uploading, and reject too-short, oversized or malformed files.
5. Check focus/navigation on mobile and desktop, audio shutdown on exit, and the manual beat offset versus the supplied recording's first downbeat.
6. Verify the exported **R2** hand chart imports as expected, without falsely implying footwork or full-workout reconstruction.

## Future

Potential R7 additions: original music arrangement and phrase editing, saved session libraries under explicit user control, more reviewed dance techniques, and trustworthy accessibility/hardware acceptance evidence. Do not add invented calorie burn or full-body accuracy metrics just to make dashboards look impressive.
