@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Error: Node.js was not found in PATH.
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo Error: pnpm was not found in PATH.
  exit /b 1
)

call pnpm install
if errorlevel 1 exit /b %errorlevel%

rem link-dsh.mjs resolves the real entry from the package bin field and runs a dsh --version smoke test.
node "%~dp0scripts\link-dsh.mjs"
if errorlevel 1 exit /b %errorlevel%

exit /b 0