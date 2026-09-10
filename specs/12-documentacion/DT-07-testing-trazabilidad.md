# DT-07 — Testing y Trazabilidad Spec → Código

> Parte de la [documentación técnica](_index.md).  
> Usa este documento para escribir nuevos tests, entender los existentes o verificar que una spec tiene implementación.

---

## Configuración de tests

- Framework: **Jest 30** con **ts-jest**
- Config principal: `jest.config.ts`
- Config integración: `jest.integration.config.ts`
- Path aliases resueltos: `@common/*` → `src/common/*`, `@modules/*` → `src/modules/*`

```bash
npm test                   # Ejecutar una vez
npm run test:watch         # Modo desarrollo (watch)
```

---

## Tests implementados

**Archivo**: `test/criterios-aceptacion.spec.ts`

| Test ID | Criterio | Qué verifica |
|---------|----------|--------------|
| AC-001 | Cobro simple con IVA | Base imponible + cuota para IVA 10% y 21%, total correcto al céntimo |
| AC-002 | División de cuenta | Split en partes iguales con distribución correcta de céntimos sobrantes |
| AC-006 | Hash VeriFactu | Cadena SHA-256 encadenada, hash anterior referenciado correctamente |
| AC-008 | Arqueo de caja | `descuadre = contadoEfectivo − efectivoEsperado` |
| AC-030 | Modelo 303 | Cálculo correcto de base imponible IVA trimestral |
| INV-030 | Partida doble | `Σ cargos = Σ abonos` en todos los asientos contables |

**Archivo**: `test/m2-erp-kds.spec.ts`

Tests de integración para módulo ERP / KDS (gestión de cocina).

---

## Smoke test de API (integración HTTP real)

**Script**: `scripts/smoke-test-api.ps1`  
**Tipo**: integración end-to-end — requiere backend y DB arrancados.  
**Cuándo ejecutar**: antes de cualquier merge a `main`, en cada release, y después de aplicar migraciones en staging/producción.

```powershell
# Requiere backend en http://localhost:3000 y DB con seed
powershell -ExecutionPolicy Bypass -File scripts/smoke-test-api.ps1

# Con salida detallada de cada respuesta JSON:
powershell -ExecutionPolicy Bypass -File scripts/smoke-test-api.ps1 -Verbose
```

### Pasos que ejecuta

| # | Método | Endpoint | Qué verifica |
|---|--------|----------|--------------|
| 1 | GET | `/setup/info` | Devuelve establecimiento, empleados con `puesto`, caja activa |
| 2 | GET | `/mesas/establecimiento/:id/mapa` | Responde con zonas y mesas |
| 3 | GET | `/productos/catalogo` | Catálogo no vacío (≥1 producto) |
| 4 | POST | `/mesas/barra/abrir` | Crea servicio, devuelve `idServicio` |
| 5 | POST | `/comandas` | Toma 2 líneas de comanda sobre el servicio |
| 6 | GET | `/comandas/servicio/:id/cuenta` | Total > 0, desglose IVA presente |
| 7 | POST | `/cobros/servicio/:id` | Emite ticket con `codigoCompleto` |

### Salida esperada (todo OK)

```
========================================
  Resultado: 7/7 pasos OK
========================================
```

Si algún paso falla, el script devuelve exit code 1 y describe el error. El smoke test crea datos reales en la BD (un servicio + ticket por cada ejecución). En staging, esto es intencionado. En producción, no ejecutar salvo que haya un entorno de pruebas aislado.

> El script usa los datos del seed para resolver `camareroId` automáticamente (primer empleado con `puesto = camarero`). No requiere UUIDs hardcodeados.

---

## Trazabilidad Spec → Código

| Spec | Service | Controller/Handler |
|------|---------|-------------------|
| SK-001 (Abrir mesa) | `MesaService.abrirMesa()` | `MesaController.abrirMesa()` |
| SK-002 (Tomar comanda) | `ComandaService.tomarComanda()` | `ComandaController.tomarComanda()` |
| SK-003 (Calcular cuenta) | `ComandaService.calcularCuenta()` | `ComandaController.calcularCuenta()` |
| SK-004 (Dividir cuenta) | `ComandaService.dividirCuenta()` | `ComandaController.dividirCuenta()` |
| SK-005/006 (Cobrar + ticket) | `CobroService.cobrarServicio()` | `CobroController.cobrar()` |
| SK-007 (Factura completa) | `CobroService.emitirFacturaCompleta()` | `CobroController.facturaCompleta()` |
| SK-008 (Rectificativa) | `CobroService.emitirRectificativa()` | `CobroController.rectificativa()` |
| SK-009 (Caja) | `CajaService.*()` | `CajaController.*()` |
| OP-001 (Mesa PRE/POST) | `MesaService.abrirMesa()` — valida estado libre/reservada |  |
| OP-002 (Comanda PRE/POST) | `ComandaService.tomarComanda()` — servicio activo, ≥1 línea |  |
| OP-003 (Anular línea) | `ComandaService.anularLinea()` — requiere rol gerente |  |
| OP-010/011/012 (Caja) | `CajaService.abrirTurno/cerrarTurno/registrarMovimiento()` |  |
| RN-001 (Tipos IVA) | Enum `TipoIVA` en schema Prisma |  |
| RN-002 (PVP incluye IVA) | Campo `precioConIva` en `Producto`, base calculada en services |  |
| RN-003 (Multi-IVA en cuenta) | `ComandaService.calcularCuenta()` — desglosa por tipo de IVA |  |
| RN-010 (Factura simplificada) | `CobroService.cobrarServicio()` → tipo `simplificada` si < 3.000€ |  |
| RN-030 (Una mesa = un servicio) | `MesaService.abrirMesa()` — verifica no hay servicio activo |  |
| RN-040 (Descuadre caja) | `CajaService.cerrarTurno()` → `descuadre = contado - esperado` |  |
| INV-007/008 (VeriFactu) | `VeriFactuService` — cadena SHA-256 inmutable |  |
| EVT-004 (TicketEmitido) | `CobroService` emite → `ContableModule` + `InventarioModule` escuchan |  |
