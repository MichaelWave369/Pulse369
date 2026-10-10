# Import Pulse 369 v5 to GitHub

This project was created by Michael Hughes using GPT Work on Larrina's workstation. This source package does **not** change the original hosted project.

## Windows PowerShell

1. Download and extract `Pulse369-GitHub-Ready-v5.1.zip`.
2. Open PowerShell and navigate to the extracted `Pulse369` directory (the one containing `package.json`).
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import-to-github.ps1
```

The script clones `MichaelWave369/Pulse369`, copies the complete source including hidden files and GitHub Actions, stages changes, displays the file summary, and pushes one import commit to `main`.

**The repository is public.** Review contents before typing `PUBLISH`. The source package excludes compiled output and secrets but intentionally contains the original hosting-specific identity implementation. This implementation is for local/private use only until authentication is redesigned; do not deploy it to an unrestricted public endpoint.

If GitHub authentication fails, sign in to Git Credential Manager or run `gh auth login` (if GitHub CLI is installed), then rerun the import.

## After import

Verify **Pulse 369 checks** in GitHub Actions. It will run TypeScript, game checks, build, and Worker integration checks. Green CI verifies software tests, not physical headset behavior or production authentication.
