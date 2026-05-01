#Requires -Version 5.1
<#
  Relay — Windows starter script (Option B).
  - Installs backend deps + seeds DB in this window
  - Opens a second PowerShell window for Uvicorn (API on :8000)
  - Runs npm install + npm run dev in this window (Vite UI)
  - Sets BROWSER for Vite --open: Google Chrome if installed, else Microsoft Edge
#>
$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot

function Set-ViteBrowserEnv {
  if ($env:BROWSER) {
    return
  }
  $chromePaths = @(
    (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"),
    (Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe")
  )
  foreach ($p in $chromePaths) {
    if ($p -and (Test-Path -LiteralPath $p)) {
      $env:BROWSER = $p
      Write-Host "[Frontend] BROWSER -> Google Chrome ($p)"
      return
    }
  }
  $edgePaths = @(
    (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe")
  )
  foreach ($p in $edgePaths) {
    if ($p -and (Test-Path -LiteralPath $p)) {
      $env:BROWSER = $p
      Write-Host "[Frontend] BROWSER -> Microsoft Edge ($p)"
      return
    }
  }
  Write-Host "[Frontend] BROWSER -> (not set; Vite will use your default browser)"
}

function Resolve-ProjectDir {
  param(
    [Parameter(Mandatory = $true)][string]$PreferredName,
    [Parameter(Mandatory = $true)][string]$AlternateName
  )
  $primary = Join-Path $Root $PreferredName
  if (Test-Path $primary) {
    return (Resolve-Path $primary).Path
  }
  $fallback = Join-Path $Root $AlternateName
  if (Test-Path $fallback) {
    return (Resolve-Path $fallback).Path
  }
  throw "Could not find '$PreferredName' or '$AlternateName' under: $Root"
}

$Backend = Resolve-ProjectDir -PreferredName "Relay-Backend" -AlternateName "relay-backend"
$Frontend = Resolve-ProjectDir -PreferredName "Relay-Frontend" -AlternateName "relay-frontend"

Write-Host "Backend folder:  $Backend"
Write-Host "Frontend folder: $Frontend"
Write-Host ""

$req = Join-Path $Backend "requirements.txt"
if (-not (Test-Path $req)) {
  throw "Missing requirements.txt at: $req"
}

Push-Location $Backend
try {
  Write-Host "[Backend] pip install -r requirements.txt"
  python -m pip install -r requirements.txt
  Write-Host ""
  Write-Host "[Backend] python -m app.db.seed"
  python -m app.db.seed
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "[Backend] Starting API in a new window at http://127.0.0.1:8000"
Write-Host "          Leave that window open while you use the UI."
Start-Process powershell.exe `
  -WorkingDirectory $Backend `
  -ArgumentList @(
  "-NoExit",
  "-NoProfile",
  "-Command",
  "python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
)

Start-Sleep -Seconds 3

Push-Location $Frontend
try {
  Write-Host ""
  Write-Host "[Frontend] npm install"
  npm install
  Write-Host ""
  Set-ViteBrowserEnv
  Write-Host "[Frontend] npm run dev -- --open  (browser opens when Vite is ready)"
  npm run dev -- --open
}
finally {
  Pop-Location
}
