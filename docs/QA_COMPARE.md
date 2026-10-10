# Pulse 369 Local QA Compare

This tool is a **browser-only inspection desk for untrusted pasted diagnostic JSON**, not a fitness leaderboard or hardware benchmark.

After merging and successful Pages deployment, open `https://michaelwave369.github.io/Pulse369/compare.html`.

## Supported receipt schemas

| Schema | Input method | Clock and data |
| --- | --- | --- |
| `pulse369.desktop-rehearsal.v1` | Keyboard / screen tap | Authored beat relative to locally played music through Web Audio |
| `pulse369.local-music-lab.v1` | Quest tracked controllers | Authored beat relative to locally played music through Web Audio |
| `pulse369.quest-diagnostic.v2` | Quest tracked controllers | Standalone **visual-only** authored beat |
| `pulse369.quest-diagnostic.v1` | Quest tracked controllers | Tracking contacts only, **no rhythm scoring** |

## Manual use

1. Run Desktop Rehearsal, Quest Rhythm Lab, or Quest Music Lab. Use **Copy QA Receipt** after completing or ending the session.
2. Paste one complete JSON receipt in slot A and another in slot B. They can come from different devices, or two repetitions in one environment.
3. Select **Inspect locally**. Fields are parsed, range-checked, cross-checked and allowlisted.
4. Read each receipt independently. Imported data is marked `USER_PASTED_UNVERIFIED`, even when the structure passes.
5. Review the evidence gate, which distinguishes missing data, different test protocols, different BPM/offset settings, matched settings with unlike input hardware, or same settings with unknown calibration.
6. Optionally select **Copy sanitized inspection**. This copies *only allowlisted aggregate values*, not the pasted raw JSON or any extra fields.
7. Use **Clear both** or refresh to clear all pasted data. No persistence, network telemetry, upload, account service, cookies or local storage are involved in this implementation.

## Important limitations

A structurally valid receipt can be manually edited or fabricated. It contains no cryptographic provenance, device identity or independent observer attestation. In particular:

- Desktop keyboard input and Quest controller target entries have different timing and motion semantics.
- Authored BPM and offset can match while the actual audio tracks, playback devices, system latency, physical timing and session conditions differ.
- A Quest visual-only rhythm drill and Quest Music Lab use different clock/audio conditions.
- Tracking-only receipts have no meaningful 24-beat score.
- Mean absolute beat error and signed median error are user-reported aggregates, **not measurements of display latency, input hardware latency, performance ranking, medical outcome, exercise form or skill**.
- No direct improvement/winner/delta recommendation is calculated. The desk displays observations and protocol compatibility only.

## Security and privacy

- The parser rejects unsupported schemas, >16,384-character strings, malformed JSON, impossible hit counts, out-of-window errors, invalid session fields, and inconsistent early+late+exact totals.
- It never injects untrusted JSON as HTML and never evaluates its contents.
- Input values are **allowlisted** into a new plain object; arbitrary fields such as file names, personal names, IDs, passwords, raw positions and event timestamps are not copied into results.
- Data stays in memory in the page. Visitors should clear sensitive text immediately if pasted accidentally.
- The page is a public GitHub Pages static app, not Pulse's authenticated Worker. No interaction with the original cloud-hosted fitness app or its account data.

## Automated tests

`node --test portal/qa-compare.test.mjs`

Tests cover acceptance of the four known versions, JSON size/schema checks, impossible timing values, inconsistent controller counts, empty samples, privacy allowlisting, unlike input devices with matched tempo, unlike protocols, settings mismatches, and explicit lack of attestation.

The existing Pulse 369 CI continues checking TypeScript, VR game source, browser/Worker build, public portal build, Quest geometry/rhythm, local music, desktop rehearsal, and backend integration. Actual Quest 3 usability remains a separate manual test requirement.
