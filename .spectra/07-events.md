# LAYER 07 — EVENTOS DE DOMINIO

## EVT-001 — TicketEmitido

**Ocurre cuando:** el cobro transaccional ha creado el ticket y su registro
VeriFactu, ha cerrado el servicio y ha liberado la mesa.

**Datos mínimos:** ticket, numeración, total, desglose fiscal, formas de pago,
hash VeriFactu, servicio y cliente opcional.

**Consecuencias esperadas:** los consumidores pueden actualizar inventario,
contabilidad, IVA y fidelización sin invalidar el cobro ya confirmado.

**Referencias:** US-001 y OP-001.
