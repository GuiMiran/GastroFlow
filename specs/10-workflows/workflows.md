# CAPA 10 — WORKFLOWS

> Flujos de trabajo que orquestan agentes y skills en secuencia.  
> Cada workflow: Trigger, Pasos, Agentes, Skills por paso, Resultado, Errores.  
> Formato: `WF-XXX: NombreWorkflow`

---

## WF-001: Servicio Completo de Mesa (Abrir → Comandas → Cobrar)

**Trigger**: Camarero abre una mesa.  
**Agente principal**: AG-001 (AgenteTPV), con participación de AG-002, AG-004, AG-005, AG-007.

| Paso | Agente | Skill | Descripción | Resultado |
|------|--------|-------|-------------|-----------|
| 1 | AG-001 | SK-001 (abrir_mesa) | Abrir mesa, crear servicio | Mesa ocupada, servicio activo |
| 2 | AG-001 | SK-002 (tomar_comanda) | Registrar 1+ comandas | Comandas enviadas a cocina/barra |
| 3 | AG-001 | SK-003 (calcular_cuenta) | Calcular total con desglose IVA | Cuenta preparada |
| 4 | AG-001 | SK-004 (dividir_cuenta) *(opcional)* | Si el cliente pide dividir | Subcuentas generadas |
| 5 | AG-001 | SK-005 (cobrar_servicio) | Registrar cobro(s) | Pago registrado |
| 6 | AG-001 | SK-006 (emitir_ticket_verifactu) | Generar ticket con VeriFactu | Ticket emitido, hash encadenado |
| 7 | AG-002 | SK-010 (descontar_stock_por_venta) | Descontar ingredientes según escandallos | Stock actualizado, alertas si stock bajo |
| 8 | AG-004 | SK-030 (generar_asiento_venta) | Contabilizar la venta | Asiento registrado |
| 9 | AG-005 | SK-040 (calcular_iva_repercutido_periodo) | Actualizar acumulado IVA | IVA trimestre actualizado |
| 10 | AG-007 | SK-063 (acumular_puntos) *(si cliente registrado)* | Sumar puntos fidelización | Puntos actualizados |

**Gestión de errores**:
- Si falla SK-006 (no puede generar ticket VeriFactu) → PARAR TODO. No cobrar sin ticket legal. Alertar.
- Si falla SK-010 (stock) → El cobro sigue (no se bloquea al cliente) pero se alerta en backoffice.
- Si falla SK-030 (asiento) → Cobro válido pero asiento pendiente de revisión contable.

---

## WF-002: Ciclo de Compra (Pedido → Recepción → Factura)

**Trigger**: Stock bajo mínimo o decisión manual del encargado.  
**Agente principal**: AG-003 (AgenteCompras), con participación de AG-002, AG-004, AG-005.

| Paso | Agente | Skill | Descripción | Resultado |
|------|--------|-------|-------------|-----------|
| 1 | AG-003 | SK-020 (crear_pedido_proveedor) | Crear pedido formal | Pedido registrado |
| 2 | AG-003 | SK-021 (registrar_albaran_entrada) | Al llegar mercancía, cotejar con pedido | Albarán registrado, diferencias marcadas |
| 3 | AG-002 | SK-013 (registrar_entrada_mercancia) | Actualizar stock con lo recibido | Stock incrementado |
| 4 | AG-003 | SK-024 (extraer_datos_factura_ocr) *(opcional)* | Si se sube foto de factura | Datos extraídos para validar |
| 5 | AG-003 | SK-023 (validar_factura_proveedor) | Verificar factura formal | Factura válida/inválida |
| 6 | AG-003 | SK-022 (registrar_factura_compra) | Registrar factura en el sistema | Factura registrada |
| 7 | AG-004 | SK-031 (generar_asiento_compra) | Contabilizar la compra | Asiento compra registrado |
| 8 | AG-005 | SK-041 (calcular_iva_soportado_periodo) | Actualizar IVA soportado | IVA soportado acumulado |
| 9 | AG-002 | SK-011 (calcular_escandallo) | Recalcular escandallos si precios cambiaron | Costes actualizados |

**Gestión de errores**:
- Si factura no válida (SK-023) → No registrar. Devolver al encargado para subsanar.
- Si albarán no coincide con pedido → Registrar incidencia, pedir revisión.

---

## WF-003: Cierre Trimestral Fiscal

**Trigger**: 5 días antes del vencimiento del trimestre fiscal (EVT-031).  
**Agente principal**: AG-005 (AgenteFiscal), con participación de AG-004, AG-008.

| Paso | Agente | Skill | Descripción | Resultado |
|------|--------|-------|-------------|-----------|
| 1 | AG-008 | SK-071 (verificar_consistencia_global) | Verificar que no hay inconsistencias | Sistema limpio (o alertas) |
| 2 | AG-004 | SK-036 (cuadrar_cuentas) | Verificar que la contabilidad cuadra | Cuentas cuadradas |
| 3 | AG-005 | SK-046 (generar_libro_registro_emitidas) | Generar libro IVA emitidas del trimestre | Libro generado |
| 4 | AG-005 | SK-047 (generar_libro_registro_recibidas) | Generar libro IVA recibidas del trimestre | Libro generado |
| 5 | AG-005 | SK-040 (calcular_iva_repercutido_periodo) | Calcular totales IVA repercutido | Total IVA repercutido |
| 6 | AG-005 | SK-041 (calcular_iva_soportado_periodo) | Calcular totales IVA soportado | Total IVA soportado |
| 7 | AG-005 | SK-042 (generar_borrador_modelo_303) | Generar borrador 303 | Borrador 303 listo |
| 8 | AG-005 | SK-044 (generar_borrador_modelo_111) | Generar borrador 111 retenciones | Borrador 111 listo |
| 9 | AG-005 | SK-045 (generar_borrador_modelo_115) | Generar borrador 115 alquileres (si aplica) | Borrador 115 listo |
| 10 | — | — | Notificar a contable/propietario para revisión y presentación | Borradores listos para revisión |

**Gestión de errores**:
- Si cuentas no cuadran (paso 2) → Alertar contable. No generar borradores hasta que cuadre.
- Si libros no coinciden con tickets/facturas → Alertar con diferencias específicas.

---

## WF-004: Cierre Anual Fiscal

**Trigger**: 15 enero del año siguiente.  
**Agente principal**: AG-005, con AG-004.

| Paso | Agente | Skill | Descripción | Resultado |
|------|--------|-------|-------------|-----------|
| 1 | WF-003 | — | Ejecutar cierre Q4 primero | Q4 cerrado |
| 2 | AG-005 | SK-043 (generar_borrador_modelo_347) | Declaración operaciones con terceros >3.005,06€ | Borrador 347 |
| 3 | AG-005 | — | Generar resumen anual modelo 390 | Borrador 390 |
| 4 | AG-004 | SK-034 (generar_balance_situacion) | Balance cierre de ejercicio | Balance anual |
| 5 | AG-004 | SK-035 (generar_cuenta_pyg) | PyG del ejercicio | Resultado ejercicio |
| 6 | — | — | Notificar para revisión y cuentas anuales | Documentación lista |

---

## WF-005: Gestión de Reserva Completa

**Trigger**: Cliente solicita reserva (web o teléfono).  
**Agente principal**: AG-007 (AgenteCRM), con AG-001.

| Paso | Agente | Skill | Descripción | Resultado |
|------|--------|-------|-------------|-----------|
| 1 | AG-007 | SK-060 (crear_reserva) | Verificar disponibilidad y crear reserva | Reserva confirmada |
| 2 | AG-007 | SK-066 (enviar_comunicacion) | Enviar confirmación | Email/SMS enviado |
| 3 | AG-007 | SK-066 (enviar_comunicacion) | Recordatorio 24h antes (automático) | Recordatorio enviado |
| 4a | AG-001 | SK-001 (abrir_mesa) | Si el cliente llega → abrir mesa | Continúa WF-001 |
| 4b | AG-007 | SK-062 (detectar_noshow) | Si el cliente NO llega → detectar no-show tras +30min | Reserva marcada no-show, mesa liberada |

---

## WF-006: Inventario Periódico

**Trigger**: Según configuración (semanal, quincenal, mensual) o manual.  
**Agente principal**: AG-002 (AgenteInventario).

| Paso | Agente | Skill | Descripción | Resultado |
|------|--------|-------|-------------|-----------|
| 1 | AG-002 | SK-012 (verificar_stock_minimo) | Revisar qué ingredientes están bajo mínimo | Lista de alertas |
| 2 | AG-002 | SK-014 (realizar_inventario_fisico) | Conteo real por almacén | Desviaciones calculadas |
| 3 | AG-002 | SK-016 (calcular_food_cost) | Food cost del período | % food cost por producto y global |
| 4 | AG-008 | SK-072 (generar_dashboard_ejecutivo) | Resumen con costes, mermas, desviaciones | Informe a propietario |

**Decisiones derivadas**:
- Si desviación significativa + alta → investigar posible robo/error de escandallo.
- Si food cost > umbral (ej: >35%) → revisar precios de venta o negociar con proveedores.

---

## WF-007: Onboarding de Nuevo Establecimiento

**Trigger**: Nuevo tenant se registra en el SaaS.  
**Agente principal**: AG-008 (AgenteOrquestador).

| Paso | Descripción | Agentes |
|------|-------------|---------|
| 1 | Configurar datos del establecimiento (nombre, NIF, dirección, régimen fiscal) | Configuración |
| 2 | Configurar zonas y mesas del local | AG-001 |
| 3 | Dar de alta productos con categorías, precios y tipos IVA | AG-001 |
| 4 | Configurar escandallos de los productos principales | AG-002 |
| 5 | Dar de alta proveedores principales | AG-003 |
| 6 | Dar de alta empleados con datos laborales | AG-006 |
| 7 | Configurar ejercicio fiscal y series de facturación | AG-005 |
| 8 | Configurar programa de fidelización | AG-007 |
| 9 | Configurar carta digital y reglas de reservas | AG-007 |
| 10 | Verificar consistencia global y preparar para operar | AG-008 |

---

## WF-008: Dashboard Diario del Propietario

**Trigger**: Cada mañana (automático) o bajo demanda.  
**Agente principal**: AG-008 (AgenteOrquestador).

| Paso | Agente | Skill | Dato que aporta |
|------|--------|-------|----------------|
| 1 | AG-001 | — | Ventas de ayer: total, tickets, ticket medio |
| 2 | AG-002 | SK-012 | Alertas de stock bajo |
| 3 | AG-002 | SK-016 | Food cost actual |
| 4 | AG-005 | SK-040 + SK-041 | IVA estimado a pagar este trimestre |
| 5 | AG-005 | SK-048 | Próximas obligaciones fiscales |
| 6 | AG-006 | SK-054 | Horas trabajadas semana / alertas |
| 7 | AG-007 | — | Reservas de hoy, clientes top |
| 8 | AG-008 | SK-072 | Dashboard consolidado |

---

## WF-009: Factura Rectificativa por Devolución

**Trigger**: Cliente solicita devolución o corrección de un cobro ya realizado.  
**Agente principal**: AG-001, con AG-004, AG-005.

| Paso | Agente | Skill | Descripción |
|------|--------|-------|-------------|
| 1 | AG-001 | — | Localizar ticket/factura original |
| 2 | AG-001 | SK-008 (emitir_factura_rectificativa) | Emitir rectificativa (sustitución o diferencias) |
| 3 | AG-004 | SK-030 (asiento ajuste) | Generar asiento contable de ajuste |
| 4 | AG-005 | — | Ajustar IVA repercutido del período |
| 5 | AG-002 | — | Si se devuelve producto → evaluar si se devuelve stock |
| 6 | AG-007 | — | Si cliente con fidelización → ajustar puntos |

---
