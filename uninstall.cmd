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

rem Remove the dsh / dsh.CMD / dsh.ps1 shims from pnpm's global bin directory.
node "%~dp0scripts\unlink-dsh.mjs"
if errorlevel 1 exit /b %errorlevel%

rem Remove local node_modules and verify it is actually gone (it may be locked by a running dsh).
if exist "node_modules" (
  echo Removing node_modules ...
  rmdir /s /q "node_modules"
  if exist "node_modules" (
    echo Error: failed to fully remove node_modules. It may be locked by a running dsh process. 1>&2
    exit /b 1
  )
)

echo Uninstall complete.
exit /b 0