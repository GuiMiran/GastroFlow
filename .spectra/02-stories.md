# LAYER 02 — HISTORIAS DE USUARIO

## US-001 — Cobrar un servicio de mesa — MUST

COMO camarero
QUIERO registrar una o varias formas de pago para una cuenta
PARA cerrar el servicio, emitir el ticket y liberar la mesa.

El cobro debe rechazar servicios inactivos, servicios sin comandas, cuentas no
positivas y pagos insuficientes. Cuando se completa, debe devolver el total, el
cambio, el identificador del ticket y la evidencia de registro VeriFactu.

La trazabilidad completa hacia reglas, invariantes y criterios se consolida en
la capa 11 para que cada identificador se defina primero en su capa propietaria.

**Origen histórico:** `HU-M1-COB-001` y `OP-004` del directorio `specs/`.
