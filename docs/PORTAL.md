# Pulse 369 public React portal

This is a standalone public showcase under `portal/`. It uses React 19, Vite, and CSS-only conceptual art. It has **no login, audio uploads, private progress, or API calls**. The separate `quest.html` page provides a small local-only WebXR device diagnostic. It does not load the full fitness app. The original full app remains separate.

## Build

From repo root:

```sh
pnpm install --frozen-lockfile
pnpm exec vite build --config portal/vite.config.ts
pnpm exec vite preview --config portal/vite.config.ts
```

The Vite output lives in `dist-pages/` and is built with the repository Pages base `/Pulse369/`.

## Publish on GitHub Pages

1. In repository **Settings → Pages**, set **Build and deployment → Source: GitHub Actions**.
2. Merge the portal PR into `main`.
3. Find **Pulse 369 public portal** in Actions. The main-branch push should trigger deployment automatically. Use **Run workflow** otherwise.
4. Once deployment succeeds, open `https://michaelwave369.github.io/Pulse369/`.

The CI workflow also compiles the portal so broken React builds block merges.

## Boundaries

The original Pulse v5 app needs Cloudflare Worker, D1, R2, and authenticated identity. **Do not serve the full backend publicly without replacing platform-specific trusted-identity headers** (issue #1). This public portal neither mocks user accounts nor claims that private hosted features are deployed. The four world images are CSS concepts, not captured WebXR screenshots. Fitness and headset tests still require real-device validation.

## Quest Lab

After deployment, use `https://michaelwave369.github.io/Pulse369/quest.html` from Quest Browser. The isolated diagnostic uses a user-initiated WebXR immersive session to check head/controller tracking, local-floor reference, static target contact, and optional haptics. All readings stay in memory. Press any controller trigger to exit. See `docs/MOON_RIDER_RESEARCH.md` for inspiration, licensing, and the manual headset test checklist.
