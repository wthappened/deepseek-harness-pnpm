#!/usr/bin/env bash
# Bash variant of install.cmd: pnpm install + link global dsh shims + smoke test.
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

pnpm install

# link-dsh.mjs resolves the real entry from the package bin field and runs a dsh --version smoke test.
node scripts/link-dsh.mjs