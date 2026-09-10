# LAYER 10 — WORKFLOWS

## WF-001 — Cobro de servicio

**Trigger:** el camarero confirma las formas de pago de una cuenta calculada.

**Agente:** AG-001.

**Skill:** SK-001.

**Pasos:**

1. Verificar que el servicio está activo y contiene comandas.
2. Calcular la cuenta y su desglose fiscal.
3. Aplicar POL-001 a la suma pagada.
4. Crear ticket, cobros y registro VeriFactu en una transacción.
5. Cerrar el servicio y liberar la mesa.
6. Publicar EVT-001.
7. Verificar los criterios de aceptación mediante pruebas independientes.

**Error:** cualquier fallo dentro de la transacción revierte las escrituras y
el servicio permanece sin cobrar.
