# LAYER 11 — CRITERIOS DE ACEPTACIÓN

## AC-001 — Cobro correcto con IVA incluido (US-001, BR-001, INV-001, OP-001, POL-001, EVT-001, AG-001, SK-001, WF-001)

DADO un servicio activo con una cuenta de 10,00 €, IVA incluido,
Y una forma de pago en efectivo de 15,00 €,
CUANDO se ejecuta el cobro,
ENTONCES se crea un ticket con total y desglose fiscal consistentes,
Y el cambio devuelto es 5,00 €,
Y se crea el registro VeriFactu,
Y se cierra el servicio y se libera su mesa,
Y se publica el evento de ticket emitido.

## AC-002 — Rechazo de pago insuficiente (US-001, BR-002, INV-002, OP-001, POL-001, AG-001, SK-001, WF-001)

DADO un servicio activo con una cuenta de 10,00 €,
Y una forma de pago de 5,00 €,
CUANDO se intenta ejecutar el cobro,
ENTONCES la operación se rechaza como pago insuficiente,
Y no se completa el ticket ni se cierra el servicio.

