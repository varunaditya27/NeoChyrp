#!/usr/bin/env bash
set -euo pipefail
printf '\n== NeoChyrp Startup (bash) ==\n'
if [ ! -f .env ]; then
  echo '[env] .env missing -> copy .env.example to .env and edit values.' >&2
  exit 1
fi
NO_SEED=false
FAST=false
for arg in "$@"; do
  case "$arg" in
    --no-seed) NO_SEED=true ;;
    --fast) FAST=true ;;
  esac
done
if [ "$FAST" = false ]; then
  echo '[deps] Installing/updating dependencies...'
  npm install >/dev/null
  echo '[prisma] Validating schema...'
  npx prisma validate >/dev/null
  echo '[prisma] Generating client...'
  npx prisma generate >/dev/null
  echo '[db] Running dev migration...'
  npx prisma migrate dev --name auto_boot >/dev/null
fi
if [ "$NO_SEED" = false ]; then
  echo '[seed] Executing seed script (idempotent)...'
  npm run -s db:seed >/dev/null
fi
echo '[dev] Starting Next.js dev server (Ctrl+C to exit)'
npm run dev
