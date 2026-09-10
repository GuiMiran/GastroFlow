#!/usr/bin/env pwsh
# ================================================================
# GastroFlow - Script de instalación y arranque completo
# ================================================================
# Requisitos: Docker Desktop, Node.js 18+
# Uso: .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   GastroFlow - Setup Automatizado"     -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar prerrequisitos
Write-Host "[1/7] Verificando prerrequisitos..." -ForegroundColor Yellow

$nodeVersion = & node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js no encontrado. Instala Node.js 18+ desde https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

$dockerVersion = & docker --version 2>$null
if (-not $dockerVersion) {
    Write-Host "ERROR: Docker no encontrado. Instala Docker Desktop desde https://docker.com" -ForegroundColor Red
    exit 1
}
Write-Host "  Docker: $dockerVersion" -ForegroundColor Green

# 2. Instalar dependencias backend
Write-Host ""
Write-Host "[2/7] Instalando dependencias del backend..." -ForegroundColor Yellow
Push-Location $PSScriptRoot
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm install falló" -ForegroundColor Red; exit 1 }
Write-Host "  Backend: dependencias instaladas" -ForegroundColor Green

# 3. Instalar dependencias frontend
Write-Host ""
Write-Host "[3/7] Instalando dependencias del frontend..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\frontend"
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm install frontend falló" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "  Frontend: dependencias instaladas" -ForegroundColor Green

# 4. Levantar PostgreSQL con Docker
Write-Host ""
Write-Host "[4/7] Levantando PostgreSQL con Docker..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker Compose falló. Asegúrate de que Docker Desktop está corriendo." -ForegroundColor Red
    exit 1
}
# Esperar a que PostgreSQL esté listo
Write-Host "  Esperando a que PostgreSQL esté listo..." -ForegroundColor Gray
$maxRetries = 30
$retry = 0
do {
    Start-Sleep -Seconds 1
    $retry++
    $ready = docker exec gastroflow-db pg_isready -U gastroflow 2>$null
} while ($LASTEXITCODE -ne 0 -and $retry -lt $maxRetries)

if ($retry -ge $maxRetries) {
    Write-Host "ERROR: PostgreSQL no arrancó en 30 segundos" -ForegroundColor Red
    exit 1
}
Write-Host "  PostgreSQL: listo en puerto 5432" -ForegroundColor Green

# 5. Ejecutar migraciones Prisma
Write-Host ""
Write-Host "[5/7] Ejecutando migraciones de base de datos..." -ForegroundColor Yellow
Pop-Location
Push-Location $PSScriptRoot
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: La migración falló. Intentando push directo..." -ForegroundColor Yellow
    npx prisma db push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo crear el esquema de base de datos" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Base de datos: esquema creado" -ForegroundColor Green

# 6. Seed de datos demo
Write-Host ""
Write-Host "[6/7] Cargando datos de demostración..." -ForegroundColor Yellow
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: El seed falló. Puede que necesites instalar tsx: npm install -D tsx" -ForegroundColor Yellow
    npm install -D tsx
    npx tsx prisma/seed.ts
}
Write-Host "  Seed: datos demo cargados" -ForegroundColor Green

# 7. Arrancar backend y frontend
Write-Host ""
Write-Host "[7/7] Arrancando servidores..." -ForegroundColor Yellow
Write-Host ""

# Arrancar backend en background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot
    & npm run start:dev
}

# Esperar un poco para que el backend arranque
Start-Sleep -Seconds 5

# Arrancar frontend en background
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PSScriptRoot\frontend"
    & npm run dev
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   GastroFlow está listo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:5173"     -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:3000/api/v1" -ForegroundColor Cyan
Write-Host "  Database:  postgresql://localhost:5432/gastroflow" -ForegroundColor Cyan
Write-Host ""
Write-Host "  IMPORTANTE: Copia los UUIDs del seed (arriba)" -ForegroundColor Yellow
Write-Host "  y pégalos en la página de Setup del frontend." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Pulsa Ctrl+C para detener todo." -ForegroundColor Gray
Write-Host ""

# Esperar y mostrar logs
try {
    while ($true) {
        Receive-Job $backendJob -ErrorAction SilentlyContinue | Write-Host
        Receive-Job $frontendJob -ErrorAction SilentlyContinue | Write-Host
        Start-Sleep -Seconds 2
    }
}
finally {
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
}
