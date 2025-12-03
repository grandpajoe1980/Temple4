<#
rebuild-db.ps1

Usage:
  .\scripts\rebuild-db.ps1            # Delete dev.db, push schema, generate client, seed
  .\scripts\rebuild-db.ps1 -SkipSeed  # Same but skip seeding

This script will:
  1. Delete the SQLite database file (dev.db) to clear all data
  2. Run `npx prisma db push` to create tables from schema.prisma
  3. Run `npx prisma generate` to regenerate Prisma Client
  4. Run `npm run db:seed` to seed the database (unless -SkipSeed)

It exits with non-zero on failures.
#>

param(
    [switch]$SkipSeed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Get repository root (parent of scripts folder)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Resolve-Path -Path (Join-Path $scriptDir '..') | Select-Object -ExpandProperty Path

Push-Location $root
try {
    # Step 1: Delete the database file
    $dbPath = Join-Path $root 'dev.db'
    $dbJournal = Join-Path $root 'dev.db-journal'
    
    Write-Host "== Step 1: Clearing database ==" -ForegroundColor Cyan
    if (Test-Path $dbPath) {
        Remove-Item $dbPath -Force
        Write-Host "Deleted: $dbPath"
    } else {
        Write-Host "Database file not found (clean state): $dbPath"
    }
    if (Test-Path $dbJournal) {
        Remove-Item $dbJournal -Force
        Write-Host "Deleted: $dbJournal"
    }

    # Step 2: Push schema to create fresh database
    Write-Host ""
    Write-Host "== Step 2: Pushing schema (prisma db push) ==" -ForegroundColor Cyan
    npx prisma db push --accept-data-loss
    if ($LASTEXITCODE -ne 0) {
        throw "prisma db push failed with exit code $LASTEXITCODE"
    }

    # Step 3: Generate Prisma Client
    Write-Host ""
    Write-Host "== Step 3: Generating Prisma Client ==" -ForegroundColor Cyan
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        throw "prisma generate failed with exit code $LASTEXITCODE"
    }

    # Step 4: Seed the database
    if (-not $SkipSeed) {
        Write-Host ""
        Write-Host "== Step 4: Seeding database ==" -ForegroundColor Cyan
        npm run db:seed
        if ($LASTEXITCODE -ne 0) {
            throw "npm run db:seed failed with exit code $LASTEXITCODE"
        }
    } else {
        Write-Host ""
        Write-Host "== Step 4: Skipping seed (-SkipSeed) ==" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Database rebuild complete!" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
