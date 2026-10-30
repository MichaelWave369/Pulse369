# World Forge R8 · Quest Evidence Comparator

R8 builds directly on the merged R7 Quest Acceptance Lab. It adds a **fully local, user-directed before/after comparison** of two previously exported `pulse369.quest-acceptance-receipt.v1` files.

This rung is **not** headset certification, GPU profiling, validated hardware FPS measurement, a cloud analytics system, or automatic performance optimization. The inputs remain **user-supplied, self-attested browser callback reports**, and R8 makes no claim of independent collection.

## What exists

- `portal/world-acceptance-compare.mjs`: strict parser for the existing R7 receipt schema, 24 KB maximum JSON file size, exact allowlisted fields, finite numeric checks, and explicit verification marker `USER_ATTESTED_ONLY_NOT_INDEPENDENTLY_VERIFIED`. Unknown fields (e.g. personally identifying device data) and forged format additions are rejected.
- A pure comparator computes **before/after** differences in p95 and median WebXR callback intervals, estimated callback cadence, long callback interruptions per minute, Three.js peak draw calls/triangles, observed phrase changes and budget-triggered cuts. The report records only aggregate numbers and a count of manually checked R7 acceptance items. No raw frame series, images, poses, personal identifiers, audio, track references, account data, gameplay scores or external URLs are included.
- `app/world-acceptance-compare.tsx`: new panel nested under the real Pulse369 Studio **Quest Acceptance Lab**. Import a **baseline** and **candidate** R7 receipt from device files (JSON only), read a side-by-side table, review warnings and export a local `pulse369.quest-acceptance-comparison.v1` JSON file. Comparison is browser-memory only. There is no upload, cloud account, automatic storage or background analytics.
- Strict interpretation gates: before a regression verdict is even considered, both receipts must have **30+ seconds of observed duration and 300+ callbacks**, enough samples under R7's native review threshold, the same number of observed phrase changes and an **explicit declaration by the user that test conditions were comparable**. Without those conditions, interpretation is **NOT_COMPARABLE** even if numeric deltas are shown for context.
- A potential callback regression is flagged if the candidate p95 interval rises beyond the greater of **2 ms or 10% of baseline**, or the rate of >250 ms callback gaps increases by at least **2 interruptions per minute**. These are transparent **review heuristics**, not hard FPS certification gates. A result without detected regression reads **NO_LARGE_CALLBACK_REGRESSION_DETECTED**, not PASS or Quest-ready.

## Recommended hardware comparison

1. Merge R8. In actual Quest Browser, import the **same R6 authored World Performance bundle** in both test sessions. Choose the same soundtrack, mode, world, headset/Quest browser version and approximate capture duration. Test performance changes one variable at a time.
2. In the Quest Acceptance Lab, start the R7 recorder **before** entering immersive VR. Run for **at least 30 seconds**, ideally 2–5 minutes, with authored phrase changes. Exit VR, mark only observed checklist items, and **Download evidence JSON**. Save this as **baseline**.
3. Repeat after a rendering change and export another receipt as **candidate**. Compare like-for-like motion reduction, headset settings, pacing and scene content; don't claim equivalence if these vary materially.
4. Load both receipt files into **Quest Evidence Comparator · R8**. Review warnings, the before/after table and possible callback regression flags. Confirm comparable conditions only if you genuinely held them consistent.
5. Download the **comparison JSON** for GitHub discussions or independent review. It contains the summarized browser timing data and explicit limitations, **not the authored bundle itself or user's account**.
6. Keep real hardware profiler traces separate. GPU time, display frame rate, ASW/reprojection and comfort must be checked with an appropriate headset tool and the actual user, not inferred from WebXR callback cadence.

## Automated verification

```sh
node --test portal/world-acceptance-compare.test.mjs
node --test portal/world-acceptance.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm run build
```

The game verification adds a full end-to-end **R7 recorder → R8 parser → R8 comparable/unmatched results → export** test with both 72 Hz and 60 Hz synthetic WebXR callback fixtures. These synthetic callbacks **do not constitute headset measurements**. Standalone unit tests exercise malformed files, unknown identifying fields, invalid numeric values, missing matched conditions, dissimilar phrase workloads, too-short runs, clean baselines and degraded candidate pacing.

## Privacy and interpretation boundary

The R8 comparator performs no network requests and does not persist the imported receipt files. Any R8 report downloaded and shared remains **under the user's control**. It cannot verify identity, hardware, authorship, manual checklist responses, matching conditions, source integrity or actual GPU presentation timings. The original R7 files are unsigned, so a user can fabricate or edit them; R8 does not turn these claims into independent evidence.

**R8 does not modify game scoring, hit detection, controller positions, soundtrack playback, workouts, session save endpoints, WorldPacks or authored DanceFlow choreography.**
