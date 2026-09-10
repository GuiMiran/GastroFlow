# INV-04.1 — Invariantes Fiscales y de Facturación

> **Sección**: 04.1  
> **Dominio**: Facturación, IVA, VeriFactu  
> **Agentes relacionados**: AG-001 (TPV), AG-005 (Fiscal)  
> **Total invariantes**: 9 (INV-001 a INV-009)
> **Última revisión**: 2026-03-15

---

## INV-001: Secuencialidad de numeración

Para cualquier serie de facturación, el número de la factura N+1 es exactamente el número de la factura N más 1. No existen saltos ni huecos en la secuencia.

- **Verificación**: Para toda serie S, ordenando por fecha: `num(ticket[i+1]) = num(ticket[i]) + 1`
- **Relacionado**: RN-014
- **Historias**: HU-M1-COB-004, HU-M1-COB-006

---

## INV-002: Integridad del total de ticket

El total de cualquier ticket o factura = suma de (base_imponible × (1 + tipo_iva)) de todas las líneas, menos descuentos:

`total_ticket = Σ (precio_linea) = Σ (base_imponible_linea + cuota_iva_linea)`

- **Relacionado**: RN-002, RN-003
- **Historias**: HU-M1-COB-001

---

## INV-003: Cuadre de IVA por ticket

Para cada tipo de IVA en un ticket: `cuota_iva = base_imponible × tipo_iva`, con tolerancia de ±0,01€ por redondeo.

- **Relacionado**: RN-001, RN-003
- **Historias**: HU-M1-COB-001, HU-M1-COB-002

---

## INV-004: IVA repercutido trimestral

El total de IVA repercutido declarable en el modelo 303 es la suma exacta de todas las cuotas de IVA de todos los tickets y facturas emitidos en el período.

`IVA_repercutido_Q = Σ cuotas_IVA(tickets + facturas del trimestre)`

- **Relacionado**: RN-021, HU-M3-IMP-002
- **Historias**: HU-M3-IMP-001

---

## INV-005: IVA soportado trimestral

El IVA soportado deducible declarable es la suma de las cuotas de IVA de las facturas de compra registradas y aceptadas como deducibles.

`IVA_soportado_Q = Σ cuotas_IVA(facturas compra aceptadas del trimestre)`

- **Relacionado**: RN-005, RN-021
- **Historias**: HU-M3-IMP-001

---

## INV-006: Resultado modelo 303

El resultado a pagar/compensar del trimestre siempre es esta resta exacta:

`resultado_303 = IVA_repercutido - IVA_soportado`

- **Relacionado**: RN-021
- **Historias**: HU-M3-IMP-002

---

## INV-007: Inalterabilidad VeriFactu

Un registro de facturación (ticket o factura) una vez generado y firmado con hash NUNCA puede ser modificado ni eliminado. Solo puede ser corregido mediante factura rectificativa.

- **Relacionado**: RN-017, RN-035
- **Historias**: HU-M1-COB-006

---

## INV-008: Cadena de hash VeriFactu

El hash de cada registro VeriFactu debe encadenar al hash del registro anterior de la misma serie. Cualquier ruptura en la cadena invalida todos los registros posteriores ante la AEAT.

`hash_actual = SHA256(datos_registro + hash_anterior)`

- **Relacionado**: RN-017 (RD 1007/2023 art. 12)
- **Historias**: HU-M1-COB-006

---

## INV-009: Trazabilidad 1:1 ticket → asiento contable

Todo ticket y toda factura (simplificada o completa) que alcance el estado **EMITIDA** debe tener exactamente un asiento contable vinculado antes de que el estado sea considerado **CONSERVADA**. El campo `ticket.asientoContableId` nunca puede ser null en una factura cerrada. Esta invariante es verificada por el proceso de saneamiento en cada arranque.

`∀ ticket cerrado: ticket.asientoContableId ≠ null`

- **Relacionado**: RN-080 (partida doble), INV-030 (balance), INV-032 (libro IVA)
- **Historias**: HU-M1-COB-009
- **Impacto**: El `AsientoService.onTicketEmitido()` debe ejecutar `tx.ticket.update({ asientoContableId })` después de crear el asiento, dentro de la misma transacción o como paso síncrono inmediato.
