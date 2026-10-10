# Pulse 369 v5 source import to GitHub.
# This imports the repository-ready source, not the original compiled export.
# Requires Git and GitHub authentication on this computer.
[CmdletBinding()]
param(
    [string]$Repository = "https://github.com/MichaelWave369/Pulse369.git"
)

$ErrorActionPreference = "Stop"
$source = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$target = Join-Path ([System.IO.Path]::GetTempPath()) ("pulse369-import-" + [guid]::NewGuid().ToString("N"))

Write-Host "Pulse 369 / Import v5 Source" -ForegroundColor Cyan
Write-Host "Source: $source"
Write-Host "Destination: $Repository"
Write-Warning "This GitHub repository is PUBLIC. Everything committed by this script will be publicly readable."
Write-Warning "Do not use the original unfiltered export or include .env files, credentials, or personal music."
$confirm = Read-Host 'Type PUBLISH to import and push the reviewed source'
if ($confirm -cne "PUBLISH") {
    Write-Host "Aborted. No GitHub changes were made."
    return
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is not installed or not on PATH. Install Git for Windows first."
}

git clone --branch main $Repository $target
if ($LASTEXITCODE -ne 0) { throw "Clone failed. Confirm GitHub access and permissions." }

Get-ChildItem -LiteralPath $source -Force |
    Where-Object { $_.Name -ne ".git" } |
    ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force
    }

Push-Location $target
try {
    # Reject unexpected sensitive or compiled output.
    $excluded = @(".env", ".env.local", ".env.production", "dist", "node_modules", ".wrangler", ".sites-runtime")
    foreach ($name in $excluded) {
        $path = Join-Path $target $name
        if (Test-Path $path) { throw "Unexpected excluded path present: $path. Review manually before importing." }
    }

    git add -A
    if ($LASTEXITCODE -ne 0) { throw "Could not stage source files." }

    Write-Host "Files staged:" -ForegroundColor Cyan
    git diff --cached --stat

    $changes = git diff --cached --name-only
    if (-not $changes) {
        Write-Host "Everything is already imported. No commit necessary."
        return
    }

    git commit -m "feat: import Pulse 369 v5 verified source and CI"
    if ($LASTEXITCODE -ne 0) { throw "Commit failed. Configure git user.name and user.email if needed." }

    git push origin main
    if ($LASTEXITCODE -ne 0) { throw "Push failed. Local import remains in $target for troubleshooting." }

    Write-Host "Pulse 369 source pushed successfully!" -ForegroundColor Green
    Write-Host "https://github.com/MichaelWave369/Pulse369"
}
finally {
    Pop-Location
}
