# LAYER 05 — CONTRATOS DE OPERACIÓN

## OP-001 — CobrarServicio

**PRE**

- El servicio existe y está activo.
- Tiene al menos una comanda no anulada.
- La cuenta calculada tiene total mayor que cero.
- Se informa al menos una forma de pago.
- La suma pagada cubre el total.

**POST**

- Se crea un ticket con numeración secuencial y desglose fiscal.
- Se registra el cobro y el cambio.
- Se crea el registro VeriFactu.
- El servicio queda cerrado y su mesa queda libre.
- Se publica el evento de ticket emitido.

**ERROR**

Si falla una precondición, no se crea ticket ni se cierra el servicio. La
operación transaccional revierte cualquier escritura parcial.

**Referencias:** US-001, BR-001, BR-002, INV-001 e INV-002.
