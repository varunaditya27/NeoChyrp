<#!
.SYNOPSIS
  Boot NeoChyrp (Windows PowerShell)
.DESCRIPTION
  Performs environment validation, installs dependencies, applies migrations, seeds baseline data (optional), then starts dev server.
.PARAMETER NoSeed
  Skip seeding.
.PARAMETER Fast
  Skip install & prisma validate (assumes up-to-date).
#>
Param(
  [switch]$NoSeed,
  [switch]$Fast
)
$ErrorActionPreference = 'Stop'
Write-Host '== NeoChyrp Startup (PowerShell) ==' -ForegroundColor Cyan
if (Test-Path .env) { Write-Host '[env] .env found' } else { Write-Host '[env] .env missing -> copy .env.example to .env and edit values.' -ForegroundColor Red; exit 1 }
if (-not $Fast) {
  Write-Host '[deps] Installing/updating dependencies...'
  npm install | Out-Null
  Write-Host '[prisma] Validating schema...'
  npx prisma validate | Out-Null
  Write-Host '[prisma] Generating client...'
  npx prisma generate | Out-Null
  Write-Host '[db] Running dev migration...'
  npx prisma migrate dev --name auto_boot | Out-Null
}
if (-not $NoSeed) {
  Write-Host '[seed] Executing seed script (idempotent)...'
  npm run db:seed | Out-Null
}
Write-Host '[dev] Starting Next.js dev server (Ctrl+C to exit)' -ForegroundColor Green
npm run dev
