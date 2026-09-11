#!/usr/bin/env bash
# Bash variant of uninstall.cmd: remove global dsh shims + local node_modules.
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js was not found in PATH." >&2
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm was not found in PATH." >&2
  exit 1
fi

# Remove the dsh / dsh.CMD / dsh.ps1 shims from pnpm's global bin directory.
node scripts/unlink-dsh.mjs

# Remove local node_modules and verify it is actually gone.
if [ -d "node_modules" ]; then
  echo "Removing node_modules ..."
  rm -rf node_modules
  if [ -e "node_modules" ]; then
    echo "Error: failed to fully remove node_modules. It may be locked by a running dsh process." >&2
    exit 1
  fi
fi

echo "Uninstall complete."