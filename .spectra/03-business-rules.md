# LAYER 03 — REGLAS DE NEGOCIO

## BR-001 — El precio B2C incluye IVA

En una venta al consumidor final, los precios de carta usados por el cálculo de
la cuenta incluyen IVA. La base imponible se obtiene hacia atrás para cada tipo
y el ticket presenta el desglose correspondiente.

**Fuente heredada:** `RN-002` y `RN-003` de
`specs/03-reglas-negocio/RN-03.1-fiscales-iva.md`, que citan el artículo 11 del
RD 2505/1983 y el artículo 6 del RD 1619/2012. La vigencia y aplicación exacta
de estas referencias requieren revisión jurídica independiente.

## BR-002 — El pago debe cubrir la cuenta

El total pagado debe ser igual o superior al total de la cuenta. Si lo supera,
la diferencia es el cambio; si es inferior, el cobro se rechaza sin emitir un
ticket ni cerrar el servicio.

**Fuente de dominio:** contrato histórico `OP-004` e invariante histórico
`INV-014` de `specs/`.

