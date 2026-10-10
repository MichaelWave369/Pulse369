# Pulse 369 · Quest 3 First-Run Acceptance

## Purpose

The repository's green GitHub Actions builds **do not establish that Quest 3 VR behavior works**. This public manual station gives a person with a headset a repeatable checklist for real-device acceptance and a narrowly scoped, self-reported outcome.

Once deployed: `https://michaelwave369.github.io/Pulse369/first-run.html`.

The station is isolated from the authenticated full Pulse fitness app; no accounts, Cloudflare D1/R2, personal health metrics, song files, or browser telemetry are involved.

## Preparation

1. Open the acceptance station in Meta Quest Browser over HTTPS, optionally using another device to read the instructions.
2. Keep the station tab open and open its linked Quest and Music labs in separate tabs. All checklist selections live only in this tab's memory; they disappear on refresh or browser close.
3. Choose the actually used device category. Merely selecting Quest 3 **does not verify** the hardware.
4. Use a clear play area and a comfortable seated/standing position. Stop if you feel discomfort, pain, or dizziness. A failure to enter/exit immersive VR safely is a blocking defect.
5. Test only music that you have rights to download and play. Choose a small local MP3 or WAV and do not post song content or filenames to issues.

## Steps

The guided page includes fixed pass/fail/blocked/not-run results for:

- HTTPS + WebXR availability; explicit VR entry
- Target placement in front of the player; both controllers tracked and contacts counted
- Grip re-centering; trigger/system-menu exit and clean re-entry
- Seated comfort and reach; 24-beat visual rhythm matching
- Local audio preflight, short playback preview and a local-file VR drill
- Anonymous receipts; safe review through QA Compare

No step is auto-marked PASS. A person must explicitly mark each observation; use NOT RUN for anything untested and BLOCKED for anything prevented by another problem.

## Release gate

The local logic is deliberately conservative:

- `FAILURE_REPORTED`: one or more steps marked fail.
- `HEADSET_NOT_ATTESTED`: no self-reported headset category selected (including desktop-only sessions).
- `CORE_HARDWARE_INCOMPLETE`: required headset, controller, recenter or safe-exit steps have not been marked pass.
- `BLOCKED_OBSERVATIONS`: core pass but optional steps remain blocked.
- `CORE_PASS_REPORTED_MORE_TO_TEST`: core pass but other steps not attempted.
- `MANUAL_REVIEW_CANDIDATE`: every step self-reported pass.

**None of these labels means VERIFIED, PRODUCTION READY, MEDICALLY VALIDATED, or independently audited.** Device attestation, direct observation, repeatability, headset comfort, audio/display latency calibration, and full fitness-session testing remain outside the site's scope.

## Anonymous manual record

The **Copy Manual QA Receipt** button writes an allowlisted JSON with schema `pulse369.quest-first-run-manual.v1`, device category, fixed test IDs, selected status values, gate state, counts, and provenance `MANUAL_SELF_REPORTED_UNVERIFIED`.

It **never** includes free-text notes, browser geolocation, tracking coordinates, contact data, device identifiers, file names, music, accounts, names, or a unique fingerprint. The copy is explicit and optional; nothing is automatically saved or uploaded.

The **QA Compare** tool currently supports four *numerical timing/tracking* receipt schemas; this first-run manual receipt is a separate checklist format and is **not** a fifth timing source. If there are hardware failures, open a GitHub issue and describe the reproduction steps without sharing personal data or audio.

## Verification

```sh
node --test portal/quest-first-run.test.mjs
pnpm exec vite build --config portal/vite.config.ts
```

Unit tests cover unique/checkable step IDs, invalid status rejection, default incompleteness, no desktop false-qualification, failure blocking, optional blocked steps, all-pass unverified status, and exclusion of arbitrary personal fields.

The Pages build publishes the first-run station separately. The original app and full authenticated backend remain unchanged; issue #1 still gates production rehosting.
