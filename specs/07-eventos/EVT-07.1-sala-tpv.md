# 07.1 — Eventos de Sala / TPV

> **Sección**: 07.1 de Capa 07 — Eventos de Dominio  
> **Dominio**: Sala / TPV  
> **Total eventos**: 7 (EVT-001 a EVT-007)  
> **Agentes productores**: AG-001 AgenteTPV  
> **Fecha**: 2026-03-14

---

**EVT-001: MesaAbierta**  
- Ocurre cuando: Un camarero abre una mesa para un nuevo servicio.
- Datos del evento: id_mesa, id_servicio, id_camarero, hora_apertura, num_comensales.
- DISPARA:
  1. Actualizar estado de mesa a "ocupada" en el mapa de sala.
  2. Si la mesa tenía reserva asociada → marcar reserva como "cumplida".

**EVT-002: ComandaRegistrada**  
- Ocurre cuando: Un camarero confirma una comanda en una mesa.
- Datos del evento: id_comanda, id_servicio, id_mesa, id_camarero, lineas[{producto, cantidad, modificadores, precio, tipo_iva}], hora.
- DISPARA:
  1. Enviar líneas de comanda a pantalla de COCINA (productos de cocina).
  2. Enviar líneas de comanda a pantalla de BARRA (productos de barra).
  3. Actualizar el total de la cuenta del servicio.
  4. Si algún producto tiene alérgenos → mostrar alerta visual.

**EVT-003: PlatoListo**  
- Ocurre cuando: El cocinero marca un plato como listo para servir.
- Datos del evento: id_linea_comanda, id_mesa, hora_listo.
- DISPARA:
  1. Notificar al camarero asignado que el plato está listo.
  2. Registrar tiempo de preparación (hora_listo - hora_comanda).

**EVT-004: TicketEmitido**  
- Ocurre cuando: Se cobra un servicio y se genera un ticket/factura simplificada.
- Datos del evento: id_ticket, numero_ticket, serie, id_servicio, id_mesa, lineas, bases_imponibles[{tipo_iva, base, cuota}], total, formas_pago[{tipo, importe}], hora, hash_verifactu, hash_anterior.
- DISPARA:
  1. Registrar en libro de facturas emitidas.
  2. Generar asiento contable automático (OP-030).
  3. Descontar stock de ingredientes según escandallos (OP-023).
  4. Actualizar IVA repercutido acumulado del período.
  5. Liberar mesa (estado "libre").
  6. Cerrar servicio.
  7. Si cliente registrado → acumular puntos de fidelización (OP-041).
  8. Actualizar estadísticas de ventas en tiempo real (dashboard).

**EVT-005: FacturaCompletaEmitida**  
- Ocurre cuando: Se emite factura completa (con datos del destinatario).
- Datos del evento: id_factura, numero_factura, serie, datos_emisor, datos_destinatario, lineas, desglose_iva, total, hora.
- DISPARA:
  1. Registrar en libro de facturas emitidas.
  2. Si no existía ya asiento (porque sustituye a ticket) → ajustar asiento contable.

**EVT-006: FacturaRectificativaEmitida**  
- Ocurre cuando: Se emite factura rectificativa sobre un ticket/factura anterior.
- Datos del evento: id_rectificativa, id_factura_original, motivo, tipo(sustitución|diferencias), importe_rectificado, hora.
- DISPARA:
  1. Registrar en libro de facturas emitidas con marca de rectificativa.
  2. Generar asiento contable de ajuste (reversa parcial o total).
  3. Ajustar IVA repercutido del período.
  4. Si se devuelve producto → evaluar si se ajusta stock.
  5. Si cliente con fidelización → ajustar puntos proporcionalmente.

**EVT-007: LineaComandaAnulada**  
- Ocurre cuando: Se anula una línea de comanda (antes o durante preparación).
- Datos del evento: id_linea_comanda, id_comanda, motivo, requirio_autorizacion, id_autorizador, hora.
- DISPARA:
  1. Actualizar pantalla de destino (cocina/barra) para quitar la línea.
  2. Recalcular total de cuenta del servicio.
  3. Si ya estaba en preparación → registrar merma de ingredientes.

---

### Trazabilidad

| EVT | Agentes que escuchan | Skills disparados | HU relacionadas |
|-----|---------------------|-------------------|-----------------|
| EVT-001 | AG-001, AG-007 | SK-001 | HU-M1-SAL-002 |
| EVT-002 | AG-001 | SK-002 | HU-M1-CMD-001 |
| EVT-003 | AG-001 | — | HU-M1-CMD-003 |
| EVT-004 | AG-002, AG-004, AG-005, AG-007 | SK-010, SK-030, SK-063 | HU-M1-COB-001 |
| EVT-005 | AG-004, AG-005 | SK-030 | HU-M1-COB-005 |
| EVT-006 | AG-004, AG-005, AG-002, AG-007 | SK-008 | HU-M1-COB-006 |
| EVT-007 | AG-001 | — | HU-M1-CMD-004 |
