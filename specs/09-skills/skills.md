# CAPA 09 — SKILLS

> **⚠️ [DEPRECATED] — Este archivo ha sido reemplazado por la estructura modular.**  
> **Consultar `_index.md` para el directorio actualizado.**  
> **Archivos modulares: SK-09.1 a SK-09.8 (uno por agente).**  
> **Este archivo se conserva únicamente como referencia histórica.**

> Capacidades atómicas e invocables. Son las "piezas de lego" que los agentes combinan.  
> Cada skill: Nombre, Descripción, Entrada, Salida, Reglas que aplica, Invariantes que verifica.

---

## 09.1 — Skills del AgenteTPV (AG-001)

**SK-001: abrir_mesa**  
- Descripción: Abre una mesa para iniciar un servicio.
- Entrada: id_mesa, id_camarero, num_comensales(opcional).
- Salida: id_servicio creado, hora_apertura, estado_mesa = "ocupada".
- Reglas: RN-030 (un solo servicio activo por mesa).
- Invariantes: INV-010 (estado mesa coherente), INV-011 (servicio → mesa ocupada).

**SK-002: tomar_comanda**  
- Descripción: Registra un pedido de productos en una mesa abierta.
- Entrada: id_servicio, lineas[{id_producto, cantidad, modificadores[]}].
- Salida: id_comanda, lineas con precios calculados y tipo_iva asignado, destinos(cocina/barra).
- Reglas: RN-001 (tipos IVA según producto), RN-031 (comanda ligada a servicio), RN-070 (alertar alérgenos).
- Invariantes: INV-012 (comanda siempre ligada a servicio).

**SK-003: calcular_cuenta**  
- Descripción: Calcula el total de un servicio sumando todas las comandas, agrupando por tipo de IVA.
- Entrada: id_servicio.
- Salida: total, desglose[{tipo_iva, base_imponible, cuota_iva}], lineas_detalle.
- Reglas: RN-002 (IVA incluido en precio), RN-003 (desglose por tipo).
- Invariantes: INV-002 (total = suma líneas), INV-003 (cuadre IVA).

**SK-004: dividir_cuenta**  
- Descripción: Divide la cuenta en N partes según método seleccionado.
- Entrada: id_servicio, metodo(partes_iguales | por_producto | por_importe), configuracion_division.
- Salida: subcuentas[{lineas, base_imponible, iva, total}] donde Σ totales = total_original.
- Reglas: RN-034 (suma partes = total).
- Invariantes: INV-013 (cuadre al céntimo).
- Políticas: POL-012 (método de redondeo).

**SK-005: cobrar_servicio**  
- Descripción: Registra el cobro de una cuenta o subcuenta.
- Entrada: id_cuenta (o id_subcuenta), formas_pago[{tipo, importe}].
- Salida: cobro registrado, cambio (si efectivo), id_ticket (para posterior emisión).
- Reglas: RN-032 (ticket solo al cobrar), RN-033 (total ≥ 0), RN-037 (propinas fuera de base).
- Invariantes: INV-014 (cobro cubre total).

**SK-006: emitir_ticket_verifactu**  
- Descripción: Genera ticket (factura simplificada) con cumplimiento VeriFactu.
- Entrada: datos_cobro, datos_establecimiento, hash_ticket_anterior.
- Salida: ticket con número secuencial, desglose IVA, hash SHA-256 generado y encadenado, registro VeriFactu.
- Reglas: RN-010 (simplificada hasta 3.000€), RN-011 (contenido mínimo), RN-014 (secuencial), RN-017 (VeriFactu).
- Invariantes: INV-001 (secuencialidad), INV-007 (inalterabilidad), INV-008 (cadena hash).

**SK-007: emitir_factura_completa**  
- Descripción: Genera factura completa con datos del destinatario.
- Entrada: datos_cobro, datos_destinatario({nif, nombre, direccion}), datos_establecimiento.
- Salida: factura completa con serie propia, todos los campos legales.
- Reglas: RN-012 (cuándo obligatoria), RN-013 (contenido completo).
- Invariantes: INV-001.
- Políticas: POL-002 (simplificada vs completa).

**SK-008: emitir_factura_rectificativa**  
- Descripción: Genera factura rectificativa vinculada a una factura/ticket anterior.
- Entrada: id_factura_original, tipo(sustitución|diferencias), motivo, importe_rectificado.
- Salida: factura rectificativa con serie "R", referencia al original.
- Reglas: RN-016 (tipos de rectificativa), RN-035 (anulación requiere rectificativa).
- Políticas: POL-003 (sustitución vs diferencias).

**SK-009: gestionar_arqueo_caja**  
- Descripción: Calcula el efectivo esperado y lo contrasta con el conteo real.
- Entrada: id_turno, efectivo_contado.
- Salida: efectivo_esperado, descuadre, informe_turno.
- Reglas: RN-036 (arqueo obligatorio al cierre).
- Invariantes: INV-015 (fórmula de efectivo esperado).

---

## 09.2 — Skills del AgenteInventario (AG-002)

**SK-010: descontar_stock_por_venta**  
- Descripción: Descuenta ingredientes del stock basándose en los escandallos de los productos vendidos.
- Entrada: lineas_ticket[{id_producto, cantidad}].
- Salida: movimientos_stock[{id_ingrediente, cantidad_descontada, stock_resultante}], alertas (si stock < mínimo).
- Reglas: RN-041 (descuento al cobrar, no al tomar comanda), RN-040 (permite venta con stock negativo pero alerta).
- Invariantes: INV-020 (stock trazable).
- Políticas: POL-020 (producto sin escandallo).

**SK-011: calcular_escandallo**  
- Descripción: Calcula coste teórico y food cost de un producto a partir de sus ingredientes.
- Entrada: ingredientes[{id_ingrediente, cantidad_neta, merma_%}].
- Salida: coste_teorico, food_cost_%, detalle por ingrediente (cantidad_bruta, precio_unitario, coste_linea).
- Reglas: RN-042 (fórmula con mermas), RN-043 (food cost como %).
- Invariantes: INV-022 (determinista).

**SK-012: verificar_stock_minimo**  
- Descripción: Comprueba si algún ingrediente está por debajo de su stock mínimo configurado.
- Entrada: id_almacen (o todos).
- Salida: ingredientes_bajo_minimo[{id, nombre, stock_actual, stock_minimo, deficit}].
- Políticas: POL-021.

**SK-013: registrar_entrada_mercancia**  
- Descripción: Incrementa stock por recepción de albarán.
- Entrada: id_albaran, lineas[{id_ingrediente, cantidad, id_almacen}].
- Salida: stock actualizado por ingrediente.
- Invariantes: INV-020, INV-021.

**SK-014: realizar_inventario_fisico**  
- Descripción: Registra conteo real y calcula desviaciones.
- Entrada: id_almacen, conteo[{id_ingrediente, cantidad_real}].
- Salida: desviaciones[{ingrediente, stock_teorico, stock_real, diferencia, valor_diferencia_€}].
- Invariantes: INV-020.

**SK-015: traspasar_stock_entre_almacenes**  
- Descripción: Mueve stock de un almacén a otro.
- Entrada: id_almacen_origen, id_almacen_destino, ingredientes[{id, cantidad}].
- Salida: stock actualizado en ambos almacenes, movimiento registrado.
- Invariantes: INV-021 (movimiento con origen).

**SK-016: calcular_food_cost**  
- Descripción: Calcula el food cost global del establecimiento o por categoría.
- Entrada: periodo(fecha_inicio, fecha_fin), filtro(categoria|todos).
- Salida: food_cost_%_global, food_cost_por_producto[{producto, coste, pvp, %}], food_cost_por_categoria.

---

## 09.3 — Skills del AgenteCompras (AG-003)

**SK-020: crear_pedido_proveedor**  
- Descripción: Crea un pedido formal a un proveedor.
- Entrada: id_proveedor, lineas[{id_ingrediente, cantidad, precio_estimado}].
- Salida: id_pedido, estado = "pendiente", total_estimado.

**SK-021: registrar_albaran_entrada**  
- Descripción: Registra la recepción de mercancía y contrasta con pedido.
- Entrada: id_proveedor, id_pedido(si existe), lineas_recibidas[{id_ingrediente, cantidad_recibida}].
- Salida: id_albaran, diferencias_con_pedido, incidencias.

**SK-022: registrar_factura_compra**  
- Descripción: Registra una factura de proveedor en el sistema.
- Entrada: id_proveedor, numero_factura, fecha, lineas[{concepto, base, tipo_iva}], total.
- Salida: id_factura_registrada, asiento_contable_generado, iva_soportado_registrado.
- Reglas: RN-005 (IVA soportado deducible).
- Invariantes: INV-033.

**SK-023: validar_factura_proveedor**  
- Descripción: Verifica que una factura cumple requisitos formales (NIF, numeración, desglose IVA, totales cuadran).
- Entrada: datos_factura.
- Salida: {valida: true/false, errores[]}.

**SK-024: extraer_datos_factura_ocr**  
- Descripción: Extrae datos estructurados de una imagen/PDF de factura mediante OCR.
- Entrada: archivo(imagen|pdf).
- Salida: datos_extraidos{proveedor, nif, numero, fecha, lineas, iva, total, confianza_%}.

---

## 09.4 — Skills del AgenteContable (AG-004)

**SK-030: generar_asiento_venta**  
- Descripción: Genera asiento contable a partir de un ticket/factura de venta.
- Entrada: datos_ticket{formas_pago, bases_iva[], cuotas_iva[], total}.
- Salida: asiento{apuntes[{cuenta, cargo, abono}]}.
- Reglas: RN-080 (partida doble), RN-081 (cuentas PGC).
- Invariantes: INV-030 (cuadre).

**SK-031: generar_asiento_compra**  
- Descripción: Genera asiento contable a partir de factura de compra.
- Entrada: datos_factura{tipo_gasto, bases_iva[], cuotas_iva[], total, id_proveedor}.
- Salida: asiento{apuntes[]}.
- Invariantes: INV-030.

**SK-032: generar_asiento_manual**  
- Descripción: Permite al contable crear un asiento manualmente.
- Entrada: fecha, concepto, apuntes[{cuenta, cargo, abono}].
- Salida: asiento registrado.
- Invariantes: INV-030 (obligatorio que cuadre).

**SK-033: consultar_libro_diario**  
- Descripción: Genera el libro diario para un período.
- Entrada: fecha_inicio, fecha_fin.
- Salida: asientos ordenados cronológicamente.

**SK-034: generar_balance_situacion**  
- Descripción: Genera balance de situación a una fecha.
- Entrada: fecha_corte.
- Salida: activo, pasivo, patrimonio_neto (debe cuadrar INV-031).

**SK-035: generar_cuenta_pyg**  
- Descripción: Genera cuenta de pérdidas y ganancias para un período.
- Entrada: fecha_inicio, fecha_fin.
- Salida: ingresos, gastos, resultado del ejercicio.

**SK-036: cuadrar_cuentas**  
- Descripción: Verifica que todas las cuentas cuadran y no hay asientos descuadrados.
- Entrada: (nada — revisa todo).
- Salida: {cuadra: true/false, descuadres[]}.
- Invariantes: INV-030, INV-031.

---

## 09.5 — Skills del AgenteFiscal (AG-005)

**SK-040: calcular_iva_repercutido_periodo**  
- Descripción: Suma todo el IVA repercutido en un período.
- Entrada: trimestre, año.
- Salida: total_por_tipo[{tipo_iva, base_total, cuota_total}], total_global.
- Invariantes: INV-004.

**SK-041: calcular_iva_soportado_periodo**  
- Descripción: Suma todo el IVA soportado deducible en un período.
- Entrada: trimestre, año.
- Salida: total_por_tipo[{tipo_iva, base_total, cuota_total}], total_global.
- Invariantes: INV-005.

**SK-042: generar_borrador_modelo_303**  
- Descripción: Genera borrador del modelo 303 con todas las casillas.
- Entrada: trimestre, año.
- Salida: casillas_modelo_303{repercutido_4, repercutido_10, repercutido_21, soportado_total, resultado, a_compensar_anterior, resultado_final}.
- Invariantes: INV-006.

**SK-043: generar_borrador_modelo_347**  
- Descripción: Genera declaración anual de operaciones con terceros.
- Entrada: año.
- Salida: terceros[{nif, nombre, importe_anual, desglose_trimestral}] donde importe > 3.005,06€.
- Reglas: RN-022.

**SK-044: generar_borrador_modelo_111**  
- Descripción: Genera declaración de retenciones IRPF.
- Entrada: trimestre, año.
- Salida: perceptores[{nif, nombre, rendimiento, retencion}], total_retenciones.
- Reglas: RN-023.

**SK-045: generar_borrador_modelo_115**  
- Descripción: Genera declaración de retenciones de alquileres.
- Entrada: trimestre, año.
- Salida: arrendadores[{nif, nombre, renta, retencion_19%}], total_retenciones.
- Reglas: RN-024.
- Políticas: POL-007.

**SK-046: generar_libro_registro_emitidas**  
- Descripción: Genera libro registro de facturas emitidas.
- Entrada: periodo.
- Salida: registros[{numero, fecha, base, tipo_iva, cuota, total}], totales.
- Invariantes: INV-032.

**SK-047: generar_libro_registro_recibidas**  
- Descripción: Genera libro registro de facturas recibidas.
- Entrada: periodo.
- Salida: registros[{proveedor, nif, numero, fecha, base, tipo_iva, cuota, total}], totales.
- Invariantes: INV-033.

**SK-048: verificar_calendario_fiscal**  
- Descripción: Comprueba qué obligaciones fiscales están próximas a vencer.
- Entrada: fecha_actual.
- Salida: obligaciones_proximas[{modelo, periodo, fecha_vencimiento, dias_restantes, estado}].
- Reglas: RN-020.

**SK-049: calcular_retencion_alquiler**  
- Descripción: Calcula la retención del 19% sobre el alquiler del local.
- Entrada: importe_renta_mensual.
- Salida: retencion_mensual, retencion_trimestral.
- Políticas: POL-007.

---

## 09.6 — Skills del AgenteRRHH (AG-006)

**SK-050: crear_cuadrante_turnos**  
- Descripción: Genera cuadrante semanal de turnos verificando reglas laborales.
- Entrada: semana, empleados, turnos_propuestos[{id_empleado, dia, hora_inicio, hora_fin}].
- Salida: cuadrante_validado o errores[{conflicto, empleado, motivo}].
- Invariantes: INV-040, INV-041.

**SK-051: registrar_fichaje**  
- Descripción: Registra entrada o salida de un empleado.
- Entrada: id_empleado, tipo(entrada|salida), hora.
- Salida: fichaje registrado, horas_jornada (si es salida).
- Reglas: RN-050.

**SK-052: calcular_horas_trabajadas**  
- Descripción: Calcula horas ordinarias y extras de un empleado en un período.
- Entrada: id_empleado, periodo.
- Salida: horas_ordinarias, horas_extra, total, horas_extra_acumulado_año.
- Invariantes: INV-042.
- Políticas: POL-041.

**SK-053: detectar_conflicto_turno**  
- Descripción: Verifica si un turno propuesto viola reglas laborales.
- Entrada: id_empleado, turno_propuesto{dia, hora_inicio, hora_fin}.
- Salida: {valido: true/false, conflictos[{tipo, descripcion}]}.
- Políticas: POL-040.

**SK-054: generar_informe_horas**  
- Descripción: Genera informe de horas trabajadas de todos los empleados.
- Entrada: periodo.
- Salida: por_empleado[{nombre, horas_ordinarias, horas_extra, ausencias, total}].

---

## 09.7 — Skills del AgenteCRM (AG-007)

**SK-060: crear_reserva**  
- Descripción: Registra una reserva verificando disponibilidad.
- Entrada: fecha, hora, num_comensales, datos_cliente{nombre, telefono, email(opcional)}.
- Salida: id_reserva, confirmacion, id_mesa_asignada(si aplica).

**SK-061: cancelar_reserva**  
- Descripción: Cancela una reserva existente.
- Entrada: id_reserva, motivo(opcional).
- Salida: reserva cancelada, mesa liberada.

**SK-062: detectar_noshow**  
- Descripción: Identifica reservas cuyo cliente no aparecerá (hora + margen superados).
- Entrada: hora_actual.
- Salida: reservas_noshow[{id_reserva, id_cliente, hora_reserva}].
- Políticas: POL-033.

**SK-063: acumular_puntos_fidelizacion**  
- Descripción: Suma puntos al cliente según el importe del ticket.
- Entrada: id_cliente, importe_ticket.
- Salida: puntos_nuevos, saldo_total, cambio_nivel(si aplica).
- Invariantes: INV-050.
- Políticas: POL-030.

**SK-064: canjear_puntos**  
- Descripción: Canjea puntos por descuento.
- Entrada: id_cliente, puntos_a_canjear.
- Salida: descuento_generado_€, saldo_puntos_restante.
- Invariantes: INV-050, INV-051.

**SK-065: evaluar_subida_nivel**  
- Descripción: Evalúa si el cliente sube de nivel de fidelización.
- Entrada: id_cliente.
- Salida: nivel_actual, nivel_nuevo(si cambió), beneficios_desbloqueados.
- Políticas: POL-031.

**SK-066: enviar_comunicacion_personalizada**  
- Descripción: Envía email/SMS a un segmento de clientes.
- Entrada: segmento(filtro), mensaje, canal(email|sms).
- Salida: enviados, fallidos, rechazados_sin_consentimiento.
- Reglas: RN-062 (consentimiento LSSI).
- Invariantes: INV-052.

**SK-067: generar_carta_digital**  
- Descripción: Genera la carta digital pública con productos, precios y alérgenos.
- Entrada: id_establecimiento.
- Salida: carta{categorias[{nombre, productos[{nombre, descripcion, precio_iva_incluido, alergenos[], foto, disponible}]}]}.
- Reglas: RN-070 (alérgenos).

**SK-068: gestionar_consentimientos**  
- Descripción: Registra, consulta o revoca consentimientos RGPD/LSSI de clientes.
- Entrada: id_cliente, accion(otorgar|revocar|consultar), tipo_consentimiento(datos|comunicaciones).
- Salida: estado_consentimiento actual.
- Reglas: RN-060, RN-061.

---

## 09.8 — Skills del AgenteOrquestador (AG-008)

**SK-070: ejecutar_workflow**  
- Descripción: Inicia y controla la ejecución de un workflow multi-agente.
- Entrada: id_workflow, parametros.
- Salida: resultado_workflow, pasos_ejecutados, errores.

**SK-071: verificar_consistencia_global**  
- Descripción: Ejecuta verificación cruzada de todas las invariantes del sistema.
- Entrada: (nada).
- Salida: {consistente: true/false, violaciones[{invariante, detalle}]}.

**SK-072: generar_dashboard_ejecutivo**  
- Descripción: Genera resumen ejecutivo del estado del negocio.
- Entrada: periodo.
- Salida: ventas_totales, ticket_medio, food_cost, iva_a_pagar, cash_flow, ocupacion, alertas.

---
