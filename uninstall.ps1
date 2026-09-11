#!/usr/bin/env pwsh
# PowerShell variant of uninstall.cmd: remove global dsh shims + local node_modules.

Set-Location -Path $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Error: Node.js was not found in PATH.' -ForegroundColor Red
  exit 1
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host 'Error: pnpm was not found in PATH.' -ForegroundColor Red
  exit 1
}

# Remove the dsh / dsh.CMD / dsh.ps1 shims from pnpm's global bin directory.
node (Join-Path $PSScriptRoot 'scripts\unlink-dsh.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Remove local node_modules and verify it is actually gone.
$nm = Join-Path $PSScriptRoot 'node_modules'
if (Test-Path $nm) {
  Write-Host 'Removing node_modules ...'
  Remove-Item -Recurse -Force $nm -ErrorAction SilentlyContinue
  if (Test-Path $nm) {
    Write-Host 'Error: failed to fully remove node_modules. It may be locked by a running dsh process.' -ForegroundColor Red
    exit 1
  }
}

Write-Host 'Uninstall complete.'
exit 0