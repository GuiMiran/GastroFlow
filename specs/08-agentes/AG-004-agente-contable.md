# AG-004 — AgenteContable (Agente de Contabilidad)

> **Código**: AG-004  
> **Módulo principal**: M3-CONTABILIDAD  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## Responsabilidad

Mantener la contabilidad al día — asientos automáticos, libros contables, balance y cuenta de PyG.

---

## Skills que usa

| Skill | Nombre | Descripción |
|-------|--------|-------------|
| SK-030 | generar_asiento_venta | Asiento automático por ticket/factura |
| SK-031 | generar_asiento_compra | Asiento automático por factura proveedor |
| SK-032 | generar_asiento_manual | Asiento manual con trazabilidad |
| SK-033 | consultar_libro_diario | Consulta libro diario filtrado |
| SK-034 | generar_balance_situacion | Balance de situación PGC Pymes |
| SK-035 | generar_cuenta_pyg | Cuenta de pérdidas y ganancias |
| SK-036 | cuadrar_cuentas | Verificación de cuadre contable |

---

## Eventos que escucha

| Evento | Reacción |
|--------|----------|
| EVT-004 (TicketEmitido) | Genera asiento de venta |
| EVT-006 (FacturaRectificativaEmitida) | Genera asiento de ajuste |
| EVT-023 (FacturaCompraRegistrada) | Genera asiento de compra |

---

## Eventos que produce

| Evento | Cuándo |
|--------|--------|
| EVT-030 (AsientoContableCreado) | Cada vez que se genera un asiento |

---

## Invariantes que respeta

| Invariante | Descripción |
|-----------|-------------|
| INV-030 | Partida doble cuadra (Σ cargo = Σ abono) |
| INV-031 | Balance cuadra (activo = pasivo + PN) |
| INV-032 | Libro IVA emitidas coincide con tickets/facturas |
| INV-033 | Libro IVA recibidas coincide con facturas proveedor |

---

## Reglas de negocio clave

| Reglas | Dominio |
|--------|---------|
| RN-080 a RN-083 | Reglas contables PGC Pymes |

---

## Historias de usuario asociadas

Ámbito: ASI → ver `specs/02-historias/M3-CONTABILIDAD/M3-ASI-asientos.md`
