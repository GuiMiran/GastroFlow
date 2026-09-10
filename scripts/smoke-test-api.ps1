#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Smoke test de la API GastroFlow — flujo completo TPV
.DESCRIPTION
  Ejecuta el ciclo completo: Setup → Abrir Barra → Añadir Comanda → Cuenta → Cobrar
  Requiere backend en http://localhost:3000 y DB con seed aplicado.
.EXAMPLE
  pwsh scripts/smoke-test-api.ps1
  pwsh scripts/smoke-test-api.ps1 -Verbose
#>

param(
  [string]$BaseUrl = 'http://localhost:3000/api/v1',
  [switch]$Verbose
)

$ErrorActionPreference = 'Stop'
$script:Passed = 0
$script:Failed = 0

function Invoke-Step {
  param([string]$Name, [scriptblock]$Action)
  Write-Host "`n[$Name]" -ForegroundColor Cyan -NoNewline
  try {
    $result = & $Action
    Write-Host '  OK' -ForegroundColor Green
    $script:Passed++
    return $result
  } catch {
    Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $script:Failed++
    return $null
  }
}

function Call-Api {
  param([string]$Method = 'GET', [string]$Path, [hashtable]$Body)
  $uri = "$BaseUrl$Path"
  $params = @{ Uri = $uri; Method = $Method; ContentType = 'application/json' }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
  $r = Invoke-RestMethod @params
  if ($Verbose) { $r | ConvertTo-Json -Depth 6 | Write-Host -ForegroundColor DarkGray }
  return $r
}

Write-Host '========================================' -ForegroundColor Yellow
Write-Host '  GastroFlow API Smoke Test' -ForegroundColor Yellow
Write-Host "  Target: $BaseUrl" -ForegroundColor Yellow
Write-Host '========================================' -ForegroundColor Yellow

# ── 1. Setup info ──────────────────────────────────────────────────────────────
$setup = Invoke-Step 'GET /setup/info' {
  $r = Call-Api -Path '/setup/info'
  if (-not $r.establecimiento.id) { throw "Sin establecimiento" }
  if ($r.empleados.Count -eq 0)   { throw "Sin empleados" }
  if (-not $r.caja.id)            { throw "Sin caja" }
  Write-Host "    Establecimiento : $($r.establecimiento.nombre)" -ForegroundColor DarkGray
  Write-Host "    Empleados       : $($r.empleados.Count)" -ForegroundColor DarkGray
  Write-Host "    Caja            : $($r.caja.nombre)" -ForegroundColor DarkGray
  $r
}
if (-not $setup) { Write-Host "`n[ABORT] Sin setup no se puede continuar.`n" -ForegroundColor Red; exit 1 }

$establecimientoId = $setup.establecimiento.id
$camareroId        = ($setup.empleados | Where-Object { $_.puesto -eq 'camarero' } | Select-Object -First 1).id
if (-not $camareroId) { $camareroId = $setup.empleados[0].id }
Write-Host "    Camarero elegido: $($camareroId.Substring(0,8))..." -ForegroundColor DarkGray

# ── 2. Mapa de mesas ──────────────────────────────────────────────────────────
$mapa = Invoke-Step "GET /mesas/establecimiento/:id/mapa" {
  $r = Call-Api -Path "/mesas/establecimiento/$establecimientoId/mapa"
  $total = 0; foreach ($z in $r) { $total += $z.mesas.Count }
  Write-Host "    Zonas: $($r.Count)  Mesas totales: $total" -ForegroundColor DarkGray
  $r
}

# ── 3. Catálogo ───────────────────────────────────────────────────────────────
$catalogo = Invoke-Step 'GET /productos/catalogo' {
  $r = Call-Api -Path '/productos/catalogo'
  if ($r.productos.Count -eq 0) { throw "Catálogo vacío" }
  Write-Host "    Categorías: $($r.categorias.Count)  Productos: $($r.productos.Count)" -ForegroundColor DarkGray
  $r
}

# ── 4. Abrir barra ────────────────────────────────────────────────────────────
$servicio = Invoke-Step 'POST /mesas/barra/abrir' {
  $r = Call-Api -Method POST -Path '/mesas/barra/abrir' -Body @{ camareroId = $camareroId }
  if (-not $r.idServicio) { throw "No se obtuvo idServicio" }
  Write-Host "    servicioId: $($r.idServicio.Substring(0,8))..." -ForegroundColor DarkGray
  $r
}
if (-not $servicio) { Write-Host "`n[ABORT] Sin servicio abierto no continúa.`n" -ForegroundColor Red; exit 1 }
$servicioId = $servicio.idServicio

# ── 5. Tomar comanda ──────────────────────────────────────────────────────────
$productos = $catalogo.productos | Select-Object -First 2
$lineas = $productos | ForEach-Object { @{ productoId = $_.id; cantidad = 1 } }

$comanda = Invoke-Step 'POST /comandas' {
  $r = Call-Api -Method POST -Path '/comandas' -Body @{
    servicioId = $servicioId
    camareroId = $camareroId
    lineas     = $lineas
  }
  if (-not $r.idComanda) { throw "idComanda no devuelto" }
  Write-Host "    Líneas creadas: $($r.lineas.Count)" -ForegroundColor DarkGray
  $r
}

# ── 6. Consultar cuenta ───────────────────────────────────────────────────────
$cuenta = Invoke-Step "GET /comandas/servicio/:id/cuenta" {
  $r = Call-Api -Path "/comandas/servicio/$servicioId/cuenta"

  # Estructura básica
  if ($r.total -le 0)        { throw "total debe ser > 0, recibido: $($r.total)" }
  if ($null -eq $r.totalSinIva) { throw "totalSinIva es null" }
  if ($null -eq $r.desglose)    { throw "desglose es null" }

  # lineas debe ser un ARRAY, no un número (BUG detectado 2026-03-15)
  if ($r.lineas -isnot [System.Array] -and $r.lineas -isnot [Object[]]) {
    throw "lineas debe ser un array, recibido tipo: $($r.lineas.GetType().Name) valor: $($r.lineas)"
  }
  if ($r.lineas.Count -eq 0) { throw "lineas está vacío, se esperaba al menos 1 línea" }

  # Cada línea debe tener los campos que usa el frontend
  $l0 = $r.lineas[0]
  foreach ($campo in @('id','productoNombre','cantidad','precioUnitario','subtotal')) {
    if ($null -eq $l0.$campo) { throw "lineas[0] le falta el campo '$campo'" }
  }

  # Verificación aritmética: Σ subtotales ≈ total
  $sumaLineas = [math]::Round(($r.lineas | Measure-Object -Property subtotal -Sum).Sum, 2)
  $totalRedondeado = [math]::Round($r.total, 2)
  if ([math]::Abs($sumaLineas - $totalRedondeado) -gt 0.02) {
    throw "Σ subtotales ($sumaLineas) no cuadra con total ($totalRedondeado)"
  }

  Write-Host "    Total: $totalRedondeado €  |  Sin IVA: $([math]::Round($r.totalSinIva, 2)) €  |  Líneas: $($r.lineas.Count)" -ForegroundColor DarkGray
  $r
}
if (-not $cuenta) { Write-Host "`n[ABORT] Sin cuenta no se puede cobrar.`n" -ForegroundColor Red; exit 1 }

# ── 7. Cobrar ─────────────────────────────────────────────────────────────────
$ticket = Invoke-Step "POST /cobros/servicio/:id" {
  $r = Call-Api -Method POST -Path "/cobros/servicio/$servicioId" -Body @{
    formasPago = @(@{ forma = 'efectivo'; importe = $cuenta.total })
  }
  if (-not $r.codigoCompleto) { throw "codigoCompleto no devuelto" }
  if ($null -eq $r.total)     { throw "total no devuelto en ticket" }
  if ($null -eq $r.cambio)    { throw "cambio no devuelto en ticket" }
  Write-Host "    Ticket: $($r.codigoCompleto)  |  Total: $($r.total) €  |  Cambio: $($r.cambio) €" -ForegroundColor DarkGray
  $r
}

# ── Resumen ───────────────────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Yellow
$total = $script:Passed + $script:Failed
Write-Host "  Resultado: $($script:Passed)/$total pasos OK" -ForegroundColor $(if ($script:Failed -eq 0) { 'Green' } else { 'Red' })
Write-Host '========================================' -ForegroundColor Yellow

if ($script:Failed -gt 0) { exit 1 }
