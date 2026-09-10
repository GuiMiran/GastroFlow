# M3-ASI — Historias de Usuario: Asientos Contables

> **Módulo**: M3-CONTABILIDAD  
> **Ámbito**: ASI — Asientos automáticos de venta y compra, ajustes, libros contables  
> **Agente responsable**: AG-004 (AgenteContable)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## HU-M3-ASI-001 | Asiento automático por venta | Must

**COMO** contable  
**QUIERO** que cada ticket/factura de venta genere automáticamente su asiento contable  
**PARA** tener la contabilidad al día sin trabajo manual.

**Criterios de aceptación:**

- **AC-01**: DADO que se cobra un ticket de 55€ (base 50€ + IVA 5€) en efectivo CUANDO se cierra el ticket ENTONCES se genera asiento: Cargo 5700-Caja (55€) → Abono 7000-Ventas (50€) + Abono 4770-IVA Repercutido (5€).
- **AC-02**: DADO que se cobra con tarjeta CUANDO se cierra ENTONCES se usa cuenta 5730 en vez de 5700.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-050 (PGC Pymes: plan cuentas hostelería) |
| Invariantes | INV-030 (Σ cargo = Σ abono en todo asiento) |
| Skills | SK-040 (generar_asiento_venta) |
| Eventos | EVT-004 (TicketEmitido → trigger asiento) |

**Estado implementación:** No implementado

---

## HU-M3-ASI-002 | Asiento automático por compra | Must

**COMO** contable  
**QUIERO** que cada factura de compra genere automáticamente su asiento contable  
**PARA** registrar gastos e IVA soportado.

**Criterios de aceptación:**

- **AC-01**: DADO que registro factura de proveedor de carne por base 200€ + IVA 10% (20€) CUANDO confirmo la factura ENTONCES se genera asiento: Cargo 6000-Compras (200€) + Cargo 4720-IVA Soportado (20€) → Abono 4000-Proveedores (220€).

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Invariantes | INV-030 |
| Skills | SK-041 (generar_asiento_compra) |
| Eventos | EVT-013 (FacturaProveedorRegistrada → trigger asiento) |

**Estado implementación:** No implementado

---

## HU-M3-ASI-003 | Revisar y ajustar asientos | Should

**COMO** contable  
**QUIERO** revisar y modificar los asientos automáticos  
**PARA** corregir excepciones o añadir información.

**Criterios de aceptación:**

- **AC-01**: DADO que un asiento automático necesita ajuste CUANDO lo edito ENTONCES queda el asiento original (no se borra) más el asiento de ajuste, manteniendo trazabilidad.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Invariantes | INV-031 (inalterabilidad — asiento original no se modifica) |

**Estado implementación:** No implementado

---

## HU-M3-ASI-004 | Consultar libros contables | Must

**COMO** contable  
**QUIERO** consultar el libro diario, mayor, balance y PyG  
**PARA** tener la visión contable completa.

**Criterios de aceptación:**

- **AC-01**: DADO que pido el balance del mes CUANDO lo genero ENTONCES muestra activo/pasivo/patrimonio neto con todas las cuentas según PGC Pymes y cuadra.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Invariantes | INV-030 (activo = pasivo + patrimonio neto) |
| Skills | SK-042 (generar_libros_contables) |

**Estado implementación:** No implementado
