# INV-04.4 — Invariantes Contables

> **Sección**: 04.4  
> **Dominio**: Asientos, balance, libros IVA  
> **Agentes relacionados**: AG-004 (Contable), AG-005 (Fiscal)  
> **Total invariantes**: 4 (INV-030 a INV-033)  
> **Última revisión**: 2026-03-14

---

## INV-030: Partida doble siempre cuadra

En todo asiento contable: `Σ cargos = Σ abonos` exactamente.

- **Relacionado**: RN-080
- **Historias**: HU-M3-ASI-001, HU-M3-ASI-002

---

## INV-031: Balance de situación siempre cuadra

`Activo total = Pasivo total + Patrimonio Neto` en cualquier momento.

- **Relacionado**: RN-083
- **Historias**: HU-M3-ASI-004

---

## INV-032: Libro de IVA emitidas coincide con tickets/facturas

El número de registros en el libro de IVA de facturas emitidas = número total de tickets + facturas completas emitidos. Cada registro tiene correspondencia 1:1 con un documento fiscal.

- **Relacionado**: RN-011
- **Historias**: HU-M3-IMP-003

---

## INV-033: Libro de IVA recibidas coincide con facturas de compra

Cada factura de compra registrada genera exactamente una entrada en el libro de facturas recibidas.

- **Historias**: HU-M3-IMP-003, HU-M2-COM-004
