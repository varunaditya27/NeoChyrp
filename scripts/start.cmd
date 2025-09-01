@echo off
SETLOCAL ENABLEDELAYEDEXPANSION
ECHO == NeoChyrp Startup (cmd.exe) ==
IF NOT EXIST .env (
  ECHO [env] .env missing -> copy .env.example to .env and edit values.
  EXIT /B 1
)
SET NO_SEED=false
SET FAST=false
:parse
IF "%1"=="" GOTO run
IF "%1"=="--no-seed" SET NO_SEED=true
IF "%1"=="--fast" SET FAST=true
SHIFT
GOTO parse
:run
IF "%FAST%"=="false" (
  ECHO [deps] Installing/updating dependencies...
  CALL npm install >NUL
  ECHO [prisma] Validating schema...
  CALL npx prisma validate >NUL
  ECHO [prisma] Generating client...
  CALL npx prisma generate >NUL
  ECHO [db] Running dev migration...
  CALL npx prisma migrate dev --name auto_boot >NUL
)
IF "%NO_SEED%"=="false" (
  ECHO [seed] Executing seed script (idempotent)...
  CALL npm run db:seed >NUL
)
ECHO [dev] Starting Next.js dev server (Ctrl+C to exit)
CALL npm run dev
