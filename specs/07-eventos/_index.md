# CAPA 07 — EVENTOS DE DOMINIO — Índice Modular

> Directorio de todos los eventos de dominio organizados por área funcional.  
> Cada archivo contiene los eventos de un dominio específico.  
> **Total**: 24 eventos en 6 dominios.  
> **Fecha**: 2026-03-14

---

## Directorio de Archivos

| Archivo | Dominio | Eventos | Rango |
|---------|---------|---------|-------|
| [EVT-07.1-sala-tpv.md](EVT-07.1-sala-tpv.md) | Sala / TPV | 7 | EVT-001 a EVT-007 |
| [EVT-07.2-caja.md](EVT-07.2-caja.md) | Caja | 2 | EVT-010 a EVT-011 |
| [EVT-07.3-inventario-compras.md](EVT-07.3-inventario-compras.md) | Inventario y Compras | 5 | EVT-020 a EVT-024 |
| [EVT-07.4-contables-fiscales.md](EVT-07.4-contables-fiscales.md) | Contabilidad y Fiscal | 3 | EVT-030 a EVT-032 |
| [EVT-07.5-rrhh.md](EVT-07.5-rrhh.md) | RRHH | 2 | EVT-040 a EVT-041 |
| [EVT-07.6-crm.md](EVT-07.6-crm.md) | CRM / Fidelización | 5 | EVT-050 a EVT-054 |

---

## Flujo de Eventos entre Agentes

```
AG-001 (TPV)
  ├── EVT-001 MesaAbierta ──────────→ AG-007 (CRM: reserva cumplida)
  ├── EVT-002 ComandaRegistrada ────→ Pantallas Cocina/Barra
  ├── EVT-003 PlatoListo ──────────→ Camarero asignado
  ├── EVT-004 TicketEmitido ───────→ AG-002 (stock) + AG-004 (asiento) + AG-005 (IVA) + AG-007 (puntos)
  ├── EVT-005 FacturaCompleta ─────→ AG-004 (asiento) + AG-005 (IVA)
  ├── EVT-006 Rectificativa ───────→ AG-004 + AG-005 + AG-002 + AG-007
  └── EVT-007 LineaAnulada ────────→ Pantallas destino

AG-002 (Inventario)
  ├── EVT-020 StockBajoMinimo ─────→ AG-003 (pedido sugerido)
  ├── EVT-021 StockNegativo ───────→ Alerta URGENTE
  └── EVT-024 InventarioFisico ────→ Informe desviaciones

AG-003 (Compras)
  ├── EVT-022 AlbaranRecibido ─────→ AG-002 (stock ↑)
  └── EVT-023 FacturaCompra ───────→ AG-004 (asiento) + AG-005 (IVA soportado)

AG-004 (Contable)
  └── EVT-030 AsientoCreado ───────→ Saldos + Balance + PyG

AG-005 (Fiscal)
  ├── EVT-031 TrimestreProximo ────→ Borradores modelos + Alerta
  └── EVT-032 Modelo303 ──────────→ Calendario fiscal

AG-006 (RRHH)
  ├── EVT-040 EmpleadoFicho ───────→ Log fichajes + Horas extra
  └── EVT-041 ConflictoTurno ──────→ Bloqueo + Alerta encargado

AG-007 (CRM)
  ├── EVT-050 ClienteRegistrado ───→ Ficha Bronce + Bienvenida
  ├── EVT-051 PuntosAcumulados ────→ Evaluación nivel
  ├── EVT-052 ReservaCreada ───────→ Confirmación + Mesa reservada
  ├── EVT-053 ReservaCancelada ────→ Mesa liberada
  └── EVT-054 NoShowDetectado ─────→ Mesa liberada + Historial
```

---

## Índice Rápido — Todos los Eventos

| EVT | Nombre | Productor | Archivo |
|-----|--------|-----------|---------|
| EVT-001 | MesaAbierta | AG-001 | EVT-07.1 |
| EVT-002 | ComandaRegistrada | AG-001 | EVT-07.1 |
| EVT-003 | PlatoListo | AG-001 | EVT-07.1 |
| EVT-004 | TicketEmitido | AG-001 | EVT-07.1 |
| EVT-005 | FacturaCompletaEmitida | AG-001 | EVT-07.1 |
| EVT-006 | FacturaRectificativaEmitida | AG-001 | EVT-07.1 |
| EVT-007 | LineaComandaAnulada | AG-001 | EVT-07.1 |
| EVT-010 | TurnoCajaAbierto | AG-001 | EVT-07.2 |
| EVT-011 | TurnoCajaCerrado | AG-001 | EVT-07.2 |
| EVT-020 | StockBajoMinimo | AG-002 | EVT-07.3 |
| EVT-021 | StockNegativo | AG-002 | EVT-07.3 |
| EVT-022 | AlbaranRecibido | AG-003 | EVT-07.3 |
| EVT-023 | FacturaCompraRegistrada | AG-003 | EVT-07.3 |
| EVT-024 | InventarioFisicoRealizado | AG-002 | EVT-07.3 |
| EVT-030 | AsientoContableCreado | AG-004 | EVT-07.4 |
| EVT-031 | TrimestreFiscalProximoACerrar | AG-005 | EVT-07.4 |
| EVT-032 | Modelo303Generado | AG-005 | EVT-07.4 |
| EVT-040 | EmpleadoFicho | AG-006 | EVT-07.5 |
| EVT-041 | ConflictoTurnoDetectado | AG-006 | EVT-07.5 |
| EVT-050 | ClienteRegistrado | AG-007 | EVT-07.6 |
| EVT-051 | PuntosAcumulados | AG-007 | EVT-07.6 |
| EVT-052 | ReservaCreada | AG-007 | EVT-07.6 |
| EVT-053 | ReservaCancelada | AG-007 | EVT-07.6 |
| EVT-054 | NoShowDetectado | AG-007 | EVT-07.6 |
