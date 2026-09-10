# CAPA 07 — EVENTOS DE DOMINIO

> **⚠️ [DEPRECATED] — Este archivo ha sido reemplazado por la estructura modular.**  
> **Consultar `_index.md` para el directorio actualizado.**  
> **Archivos modulares: EVT-07.1 a EVT-07.6 (uno por dominio).**  
> **Este archivo se conserva únicamente como referencia histórica.**

> Hechos significativos que ocurren en el sistema y disparan reacciones.  
> Formato: `EVT-XXX: NombreEvento → DISPARA: [lista de reacciones]`  
> Cada evento es un **hecho pasado** (ya ocurrió, es inmutable).

---

## 07.1 — Eventos de Sala / TPV

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

## 07.2 — Eventos de Caja

**EVT-010: TurnoCajaAbierto**  
- Ocurre cuando: Un cajero abre su turno con fondo de caja.
- Datos del evento: id_turno, id_caja, id_cajero, fondo_caja, hora_apertura.
- DISPARA:
  1. Caja operativa para cobros.

**EVT-011: TurnoCajaCerrado**  
- Ocurre cuando: Se completa el arqueo y se cierra el turno.
- Datos del evento: id_turno, id_caja, efectivo_esperado, efectivo_real, descuadre, total_ventas_turno, hora_cierre.
- DISPARA:
  1. Generar informe de turno.
  2. Si descuadre > umbral configurado → alerta al propietario.
  3. Caja queda libre para nuevo turno.

---

## 07.3 — Eventos de Inventario y Compras

**EVT-020: StockBajoMinimo**  
- Ocurre cuando: El stock de un ingrediente cae por debajo del mínimo configurado.
- Datos del evento: id_ingrediente, nombre, stock_actual, stock_minimo, almacen.
- DISPARA:
  1. Generar alerta de reposición en backoffice.
  2. Si hay proveedor habitual configurado → sugerir pedido automático.
  3. Notificar al encargado de compras.

**EVT-021: StockNegativo**  
- Ocurre cuando: El stock teórico de un ingrediente cae por debajo de 0.
- Datos del evento: id_ingrediente, nombre, stock_actual, almacen.
- DISPARA:
  1. Alerta URGENTE al propietario/encargado.
  2. Marcar ingrediente como "revisar inventario".

**EVT-022: AlbaranRecibido**  
- Ocurre cuando: Se registra la recepción de mercancía de un proveedor.
- Datos del evento: id_albaran, id_proveedor, id_pedido(si existe), lineas[{ingrediente, cantidad, conforme}], hora.
- DISPARA:
  1. Incrementar stock de ingredientes recibidos.
  2. Si hay diferencias con pedido → generar incidencia.

**EVT-023: FacturaCompraRegistrada**  
- Ocurre cuando: Se registra/valida una factura de proveedor.
- Datos del evento: id_factura, id_proveedor, numero_factura, base_imponible, desglose_iva[{tipo, base, cuota}], total, fecha.
- DISPARA:
  1. Generar asiento contable de compra (OP-031).
  2. Actualizar IVA soportado acumulado del período.
  3. Registrar en libro de facturas recibidas.
  4. Si precio ingrediente cambió → actualizar precio de coste y recalcular escandallos.
  5. Evaluar si operaciones con este proveedor superan 3.005,06€ anuales (modelo 347).

**EVT-024: InventarioFisicoRealizado**  
- Ocurre cuando: Se completa un conteo físico de inventario.
- Datos del evento: id_inventario, id_almacen, fecha, desviaciones[{ingrediente, stock_teorico, stock_real, diferencia}].
- DISPARA:
  1. Ajustar stock del sistema al conteo real.
  2. Generar informe de desviaciones.
  3. Si desviación significativa → alerta al propietario.

---

## 07.4 — Eventos Contables y Fiscales

**EVT-030: AsientoContableCreado**  
- Ocurre cuando: Se genera un asiento contable (automático o manual).
- Datos del evento: id_asiento, fecha, concepto, apuntes[{cuenta, cargo, abono}], origen(venta|compra|ajuste|manual).
- DISPARA:
  1. Actualizar saldos de las cuentas afectadas.
  2. Actualizar balance y PyG en tiempo real.

**EVT-031: TrimestreFiscalProximoACerrar**  
- Ocurre cuando: Faltan 15 días para el vencimiento de declaraciones trimestrales.
- Datos del evento: trimestre, año, modelos_pendientes[303, 111, 115...], fecha_vencimiento.
- DISPARA:
  1. Alerta al propietario y contable.
  2. Generar borradores automáticos de los modelos.
  3. Mostrar resumen en dashboard fiscal.

**EVT-032: Modelo303Generado**  
- Ocurre cuando: Se genera el borrador del modelo 303.
- Datos del evento: trimestre, año, iva_repercutido, iva_soportado, resultado, estado(borrador|validado|presentado).
- DISPARA:
  1. Notificar al contable para revisión.
  2. Actualizar estado en calendario fiscal.

---

## 07.5 — Eventos de RRHH

**EVT-040: EmpleadoFicho**  
- Ocurre cuando: Un empleado registra su entrada o salida.
- Datos del evento: id_empleado, tipo(entrada|salida), hora, id_establecimiento.
- DISPARA:
  1. Registrar en log de fichajes.
  2. Si es salida → calcular horas trabajadas de la jornada.
  3. Si horas > jornada_diaria → registrar como horas extra.
  4. Si horas_extra_acumuladas se acerca a 80 → alerta.

**EVT-041: ConflictoTurnoDetectado**  
- Ocurre cuando: Se intenta asignar un turno que viola reglas laborales.
- Datos del evento: id_empleado, turno_propuesto, motivo(solape|descanso_insuficiente|exceso_horas).
- DISPARA:
  1. Bloquear asignación.
  2. Informar al encargado del conflicto específico.

---

## 07.6 — Eventos de CRM

**EVT-050: ClienteRegistrado**  
- Ocurre cuando: Un nuevo cliente se registra (web o en local).
- Datos del evento: id_cliente, nombre, email, telefono, consentimiento_comercial, canal_registro.
- DISPARA:
  1. Crear ficha de cliente con nivel Bronce y 0 puntos.
  2. Si dio consentimiento → enviar email de bienvenida.

**EVT-051: PuntosAcumulados**  
- Ocurre cuando: Un cliente registrado acumula puntos tras un cobro.
- Datos del evento: id_cliente, puntos_nuevos, saldo_total, id_ticket.
- DISPARA:
  1. Verificar si el cliente sube de nivel (POL-031).
  2. Si sube de nivel → notificar al cliente con beneficios desbloqueados.

**EVT-052: ReservaCreada**  
- Ocurre cuando: Un cliente crea una reserva (web o teléfono).
- Datos del evento: id_reserva, id_cliente(si registrado), fecha, hora, comensales, id_mesa(si asignada).
- DISPARA:
  1. Enviar confirmación al cliente (email/SMS).
  2. Marcar mesa como "reservada" para la franja.
  3. Programar recordatorio automático (24h antes).

**EVT-053: ReservaCancelada**  
- Ocurre cuando: Se cancela una reserva.
- Datos del evento: id_reserva, motivo, cancelado_por(cliente|establecimiento).
- DISPARA:
  1. Liberar mesa reservada.
  2. Enviar confirmación de cancelación.

**EVT-054: NoShowDetectado**  
- Ocurre cuando: Un cliente no aparece a su reserva tras el margen de espera.
- Datos del evento: id_reserva, id_cliente, hora_limite.
- DISPARA:
  1. Marcar reserva como "no-show".
  2. Liberar mesa.
  3. Registrar no-show en ficha de cliente (para detección de patrones).

---
