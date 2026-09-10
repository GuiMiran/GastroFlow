# LAYER 06 — POLÍTICAS DE DECISIÓN

## POL-001 — Aceptación del pago

SI el total pagado es menor que el total de la cuenta
ENTONCES rechazar el cobro como pago insuficiente.

SI el total pagado es igual al total de la cuenta
ENTONCES aceptar el cobro con cambio cero.

SI el total pagado es mayor que el total de la cuenta
ENTONCES aceptar el cobro y devolver la diferencia como cambio.

**Referencias:** BR-002, INV-002 y OP-001.
