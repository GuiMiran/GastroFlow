# CAPA 11 — CRITERIOS DE ACEPTACIÓN — Índice Modular

> Directorio de todos los criterios de aceptación organizados por dominio.  
> Cada archivo contiene los criterios DADO/CUANDO/ENTONCES de un área funcional.  
> **Total**: 26 criterios en 7 dominios.  
> **Fecha**: 2026-03-14

---

## Directorio de Archivos

| Archivo | Dominio | Criterios | Rango |
|---------|---------|-----------|-------|
| [AC-11.1-tpv-ventas.md](AC-11.1-tpv-ventas.md) | TPV / Ventas | 8 | AC-001 a AC-008 |
| [AC-11.2-inventario.md](AC-11.2-inventario.md) | Inventario | 4 | AC-010 a AC-013 |
| [AC-11.3-compras.md](AC-11.3-compras.md) | Compras | 1 | AC-020 |
| [AC-11.4-fiscales.md](AC-11.4-fiscales.md) | Fiscal | 3 | AC-030 a AC-032 |
| [AC-11.5-rrhh.md](AC-11.5-rrhh.md) | RRHH | 3 | AC-040 a AC-042 |
| [AC-11.6-crm.md](AC-11.6-crm.md) | CRM / Fidelización | 5 | AC-050 a AC-054 |
| [AC-11.7-contabilidad.md](AC-11.7-contabilidad.md) | Contabilidad | 2 | AC-060 a AC-061 |

---

## Matriz Criterio → Módulo → HU

| Dominio | Módulo | Criterios | HU principales |
|---------|--------|-----------|----------------|
| TPV / Ventas | M1-TPV | AC-001 a AC-008 | HU-M1-COB-*, HU-M1-CAJ-* |
| Inventario | M2-ERP | AC-010 a AC-013 | HU-M2-INV-*, HU-M2-CAT-* |
| Compras | M2-ERP | AC-020 | HU-M2-COM-* |
| Fiscal | M3-CONTABILIDAD | AC-030 a AC-032 | HU-M3-IMP-* |
| RRHH | M2-ERP | AC-040 a AC-042 | HU-M2-RRH-* |
| CRM | M4-CRM | AC-050 a AC-054 | HU-M4-FID-*, HU-M4-RES-* |
| Contabilidad | M3-CONTABILIDAD | AC-060 a AC-061 | HU-M3-ASI-* |

---

## Índice Rápido — Todos los Criterios

| AC | Descripción corta | Archivo |
|----|-------------------|---------|
| AC-001 | Cobro simple con IVA correcto | AC-11.1 |
| AC-002 | División cuenta partes iguales | AC-11.1 |
| AC-003 | División cuenta por productos | AC-11.1 |
| AC-004 | Pago mixto efectivo + tarjeta | AC-11.1 |
| AC-005 | Factura completa solicitada | AC-11.1 |
| AC-006 | Secuencialidad tickets VeriFactu | AC-11.1 |
| AC-007 | Anulación ticket → rectificativa | AC-11.1 |
| AC-008 | Arqueo de caja con descuadre | AC-11.1 |
| AC-010 | Descuento stock por venta | AC-11.2 |
| AC-011 | Alerta stock bajo | AC-11.2 |
| AC-012 | Escandallo con merma | AC-11.2 |
| AC-013 | Inventario físico con desviación | AC-11.2 |
| AC-020 | Factura compra y contabilización | AC-11.3 |
| AC-030 | Cálculo Modelo 303 trimestral | AC-11.4 |
| AC-031 | Modelo 347 proveedor supera umbral | AC-11.4 |
| AC-032 | Modelo 115 retención alquiler | AC-11.4 |
| AC-040 | Fichaje y cálculo horas | AC-11.5 |
| AC-041 | Conflicto turno descanso insuficiente | AC-11.5 |
| AC-042 | Límite horas extra | AC-11.5 |
| AC-050 | Acumulación de puntos | AC-11.6 |
| AC-051 | Canjeo de puntos | AC-11.6 |
| AC-052 | Canjeo puntos insuficientes | AC-11.6 |
| AC-053 | Comunicación sin consentimiento | AC-11.6 |
| AC-054 | No-show en reserva | AC-11.6 |
| AC-060 | Asiento auto venta efectivo | AC-11.7 |
| AC-061 | Asiento compra IVA soportado | AC-11.7 |
