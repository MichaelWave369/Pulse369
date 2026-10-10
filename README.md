# Pulse 369

**VR fitness, rhythm training, movement, and community.**

Pulse 369 is a browser-based fitness and WebXR project created by **Michael Hughes (MichaelWave369)** using GPT Work on Larrina's workstation. The original hosted prototype remains separate from this repository.

The v5 project includes nine workout modes (rave, boxing, Krav-inspired rhythm, breathing, meditation, stretching, yoga, tai chi, and qigong), four procedural Three.js worlds, imported MP3/WAV music, training paths, achievement systems, clans, multiplayer rooms, and optional heart-rate monitoring. These are source-level features; real headset and production-scale behavior still need testing.

## Repository status

**Source import pending.** The verified v5 export has been prepared separately for import. The repository starts with this README to establish the correct project identity and safety notes.

## Important hosting boundary

The existing application expects trusted authentication headers from its original hosting platform. **Do not deploy the existing API to an unrestricted public Worker.** Replace the identity boundary with independently verified authentication before enabling accounts, music uploads, rooms, or clan data. A full-featured deployment also needs Cloudflare D1 and R2 storage. A GitHub Pages static deploy alone is insufficient.

No real-user music or production data should be committed to this repository.

## Development approach

Preserve the v5 baseline, import the complete source and lockfile, run TypeScript/game/Worker verification in CI, then build secure standalone hosting and headset acceptance tests. Third-party assets and dependencies retain their respective license terms. No project-wide open-source license has been selected yet.
