# World Forge R6 · Sovereign Performance Library

R6 turns authored R4/R5 DanceFlow + DomistikaXR performances into **explicitly saved browser-local shows** and portable, shareable JSON bundles. It reuses the canonical World Performance v1, WorldPack and choreography validators and introduces **no external account, backend endpoint, microphone, subscription, server synchronization or music upload**.

## Browser-local library

`app/world-performance-library.tsx` is embedded in the real Pulse369 Studio's Rave Performance Composer. It uses `lib/world-performance-library.ts` and IndexedDB (database `pulse369-world-performance-library-v1`, object store `shows`) to keep at most **12 shows** totaling **48 MB** on the current browser/device. These are conservative application quotas; the browser can impose stricter limits or evict this data. Private browsing modes may block storage.

The only persistence operation is a user-triggered **Save privately to this browser** or **Import a downloaded community bundle into your private library**. Opening the page only reads existing entries. Saving does not imply publishing, attribution verification, account backup, or cross-device synchronization. The user can open a saved show in the composer or delete their browser copy. Exported files remain untouched by local deletion.

If IndexedDB is unavailable or full, the user receives an error and can continue using the existing R4 **Export World Performance** or R6 **Download shareable bundle** flow.

## Portable bundle format

Schema `pulse369.world-library-bundle.v1`, capped at **7.3 MB**:

- Version and canonical self-check SHA-256 digest, computed using browser Web Crypto across the normalized creative show, creator/license metadata and derived preview manifest.
- `metadata.creator`: optional self-declared artist alias, **not** verified identity.
- `metadata.description`: optional short text, `tags`: up to 5 short tags, `license`: `personal`, `CC0-1.0`, or `CC-BY-4.0`. `personal` is the default and grants **no redistribution permission**; the user must deliberately choose another label for community sharing. Rights claims are entirely creator-declared.
- `preview`: title, phrase/count totals, authored BPM, scene names/object counts, estimated Quest triangles and cuts, all **derived from the validated performance** rather than arbitrary external links.
- `performance`: one entire canonical `pulse369.world-performance.v1` object holding the validated DanceFlow chart, 1–3 WorldPacks and visual cue map. The original file and all R1–R5 imports remain supported.

A checksum is useful for catching corrupted or accidentally modified bundles; **it is not a cryptographic signature**, proof of provenance, legal clearance or an anti-tamper guarantee against an adversary who can recompute SHA-256. Imported show data is validated again before persistent storage and again before opening. The client never executes bundled code or loads remote assets.

**No song files, URLs to stream tracks, recorded vocals, sound or controller samples, workout session results, biometric data or private account records are included in normalized exports.**

## How to use

1. Build the show in DomistikaXR and the Pulse369 DanceFlow Performance Composer (R1–R5).
2. In the **World Performance Library · R6** section, optionally enter a creator alias/description/tags and choose a license. Save the current show to keep it in this specific browser across normal reloads. It stays private.
3. Select **Download shareable bundle** to create a complete standalone JSON file. Share it manually by any method you choose; Pulse369 does not host it or read it from the network.
4. A recipient uses **Import a downloaded community bundle into your private library**. It is checked locally, written to their IndexedDB on explicit request, then opened into the real Composer, ready for solo Rave workouts.
5. **Open in composer** loads stored shows without changing scoring/rooms. **Delete local copy** deletes only local browser storage after confirmation.

## Verify

```sh
node --test portal/world-library-bundle.test.mjs
node scripts/verify-game.mjs
pnpm exec tsc --noEmit --incremental false
pnpm exec vite build --config portal/vite.config.ts
pnpm run build
```

The game CI harness includes bundle validation, digest roundtrip, declared preview derivation, and rejection of changed creator metadata. Pure Node tests also check invalid JSON, foreign format, malformed licenses, changed scenery/preview and size limits.

**Browser acceptance:**

- Save a multi-world show and reload Pulse369; reopen it without an internet connection and confirm its content matches.
- Import an R6 bundle into an empty library and confirm the World Composer loads the authored phrase cues, scenes, intensity and transitions.
- Export/reimport again. Corrupt the title/scene data, creator alias or preview without recomputing the digest: import must fail with a visible error and not overwrite an existing show.
- Try private browsing, blocked IndexedDB, a full 12-show shelf, or low disk space. The app must show understandable errors instead of silently losing content. Download still works if storage is unavailable.
- Test Save, Open, Delete with keyboard and touch controls. Confirm a deleted show does not delete exported JSON.
- Verify Studio users cannot open/change/import browser library shows during an active or shared workout. The actual score, controllers, soundtrack and session storage remain as before.
- On Quest 3, check browser storage persistence after reopening the browser, and test one imported show in real VR. This **requires device testing**; CI is not a substitute.

## Explicit next steps

R6 is **file sharing, not a live online publishing marketplace**. Optional community feeds, a moderated public gallery, publisher signatures, static thumbnail generation, interoperable license receipts, ZIP asset bundles and trusted verification of authorship would be additional independently reviewed rungs. This rung does not claim offline accessibility of the Pulse369 **website shell** without prior network caching; it provides offline **storage and portable format** while the app itself is running.
