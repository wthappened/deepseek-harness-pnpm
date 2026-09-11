#!/usr/bin/env pwsh
# PowerShell variant of install.cmd: pnpm install + link global dsh shims + smoke test.

Set-Location -Path $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Error: Node.js was not found in PATH.' -ForegroundColor Red
  exit 1
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host 'Error: pnpm was not found in PATH.' -ForegroundColor Red
  exit 1
}

pnpm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# link-dsh.mjs resolves the real entry from the package bin field and runs a dsh --version smoke test.
node (Join-Path $PSScriptRoot 'scripts\link-dsh.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

exit 0