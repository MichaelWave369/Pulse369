# Pulse 369: GitHub and hosting handoff

This package is a **repo-ready source fork of Larrina's Pulse 369 v5 export**, not a replacement for the deployed ChatGPT Sites application. The original ZIP remains untouched. This copy has an added GitHub Actions CI workflow and this guide. `dist/` and the original export checksum manifest are intentionally omitted because generated builds are not intended for version control. The original Sites `project_id` was removed from `.openai/hosting.json` and its D1/R2 binding names were preserved so local development can continue. No other application source was modified.

## Baseline provenance

- Original export: `Pulse-369-Complete-v5.zip`.
- Export source commit reported by manifest: `ff7d405cd067b53f3b8dc4e02aed9222528e2c88`.
- The 221 files declared in `EXPORT-MANIFEST.json` were independently verified against SHA-256 hashes with zero mismatches before preparing this fork.
- The export claims 81 game/sensor checks and 130 Worker integration checks previously passed. Those claims were **not rerun** in this sandbox because pinned dependencies were not available locally. The added CI workflow is intended to provide reproducible evidence after GitHub upload.
- This package is not licensed. The project owners should decide whether to add MIT or another license before open sourcing.

## Create the repository

1. In your own GitHub account, create **`Pulse369`**. Start **Private**, with no GitHub-generated README, `.gitignore`, or license. Decide with Larrina when to make the code public.
2. Extract this ZIP. Open a terminal in its root directory and run:

   ```sh
   git init
   git branch -M main
   git add .
   git commit -m "Import Pulse 369 v5 source and CI"
   git remote add origin https://github.com/MichaelWave369/Pulse369.git
   git push -u origin main
   ```

3. Open **Actions** in the GitHub repository and check the `Pulse 369 checks` workflow. There are no deploy secrets in this workflow.
4. Continue feature work on branches with Pull Requests, keeping this import as the baseline.

## Run locally

Requirements: Node.js >=22.13 and pnpm 11.25.0. Install dependencies with `pnpm install --frozen-lockfile`, then initialize the local database and start Vite:

```sh
pnpm install --frozen-lockfile
pnpm exec wrangler d1 migrations apply DB --config wrangler.local.json --local
pnpm run dev
```

Open `http://localhost:5173`. Localhost includes a **mock sign-in only for development**. Production authentication is different and must be implemented securely.

## Hosting reality

This is a **Vinext / React / Three.js / WebXR app with API routes**, not a self-contained static SPA. GitHub Pages **cannot serve its D1/R2 backend, private music files, clans, or secure login**. A static promo/demo site could go on Pages, but not the full experience unchanged.

For a separate full-stack deployment, plan for:

1. A Cloudflare Worker or compatible server runtime with properly configured D1 binding `DB` and R2 binding `BUCKET`.
2. Applying all five database migrations on the designated database.
3. A **trusted login / identity gateway**. The source currently trusts `oai-authenticated-user-id` headers injected by its original Sites host. When self-hosted, unauthenticated clients must not be allowed to supply those headers; strip incoming identity headers and inject verified identity at the edge or replace the mechanism entirely. **Never deploy the raw Worker publicly using untrusted header identity.**
4. HTTPS for WebXR and browser Bluetooth, device/browser compatibility checks, audio file upload limits, secure music sharing, rate limiting, and storage lifecycle policies.
5. Explicit owner confirmation before moving production data or publishing the code. The ZIP contains **no personal uploaded music, server database content, or actual production credentials** according to its export guide.

This package **does not deploy or reconfigure** the original Pulse 369 hosted site. Its Cloudflare Worker deployment path is not automated because production identities and resource IDs are deliberately not included.

## Roadmap priorities

1. Verify typecheck and tests in CI; fix any environment assumptions without changing gameplay.
2. Device matrix: desktop keyboard and touch, Quest/compatible WebXR headset, handed controllers, safety and seated mode, Bluetooth optional.
3. Configure a secure full-stack deployment with isolated dev and production resources.
4. Establish actual multi-user tests, upload/range tests, and network audio drift trials.
5. Extend the music importer to parse Suno exports and metadata; **direct Suno API/account integration is not in v5**.
6. Only after the baseline is green, design governed bridges to PhiCade, PixelForge, EVIE, More Bounce Labs, and SuperPhiVessel.
