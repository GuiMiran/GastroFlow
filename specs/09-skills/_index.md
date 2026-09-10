# CAPA 09 — SKILLS — Índice Modular

> Directorio de todos los skills organizados por agente.  
> Cada archivo contiene los skills atómicos de un agente específico.  
> **Total**: 57 skills en 8 agentes.  
> **Fecha**: 2026-03-14

---

## Directorio de Archivos

| Archivo | Agente | Skills | Rango |
|---------|--------|--------|-------|
| [SK-09.1-agente-tpv.md](SK-09.1-agente-tpv.md) | AG-001 AgenteTPV | 10 | SK-001 a SK-009, SK-073 |
| [SK-09.2-agente-inventario.md](SK-09.2-agente-inventario.md) | AG-002 AgenteInventario | 7 | SK-010 a SK-016 |
| [SK-09.3-agente-compras.md](SK-09.3-agente-compras.md) | AG-003 AgenteCompras | 5 | SK-020 a SK-024 |
| [SK-09.4-agente-contable.md](SK-09.4-agente-contable.md) | AG-004 AgenteContable | 7 | SK-030 a SK-036 |
| [SK-09.5-agente-fiscal.md](SK-09.5-agente-fiscal.md) | AG-005 AgenteFiscal | 10 | SK-040 a SK-049 |
| [SK-09.6-agente-rrhh.md](SK-09.6-agente-rrhh.md) | AG-006 AgenteRRHH | 5 | SK-050 a SK-054 |
| [SK-09.7-agente-crm.md](SK-09.7-agente-crm.md) | AG-007 AgenteCRM | 10 | SK-060 a SK-068, SK-074 |
| [SK-09.8-agente-orquestador.md](SK-09.8-agente-orquestador.md) | AG-008 AgenteOrquestador | 3 | SK-070 a SK-072 |

---

## Matriz Skill → Agente → Módulo

| Agente | Módulo | Skills | Reglas principales | Invariantes principales |
|--------|--------|--------|--------------------|------------------------|
| AG-001 AgenteTPV | M1-TPV | SK-001 a SK-009, SK-073 | RN-001–003, RN-010–017, RN-030–038 | INV-001–003, INV-007–008, INV-010–015 |
| AG-002 AgenteInventario | M2-ERP | SK-010 a SK-016 | RN-040–044 | INV-020–022 |
| AG-003 AgenteCompras | M2-ERP | SK-020 a SK-024 | RN-005 | INV-033 |
| AG-004 AgenteContable | M3-CONTABILIDAD | SK-030 a SK-036 | RN-080–083 | INV-030–031 |
| AG-005 AgenteFiscal | M3-CONTABILIDAD | SK-040 a SK-049 | RN-020–025 | INV-004–006, INV-032–033 |
| AG-006 AgenteRRHH | M2-ERP | SK-050 a SK-054 | RN-050–054 | INV-040–042 |
| AG-007 AgenteCRM | M4-CRM | SK-060 a SK-068, SK-074 | RN-060–063, RN-070 | INV-050–053 |
| AG-008 AgenteOrquestador | Transversal | SK-070 a SK-072 | Todas (verificador) | Todas |

---

## Índice Rápido — Todos los Skills

| SK | Nombre | Agente | Archivo |
|----|--------|--------|---------|
| SK-001 | abrir_mesa | AG-001 | SK-09.1 |
| SK-002 | tomar_comanda | AG-001 | SK-09.1 |
| SK-003 | calcular_cuenta | AG-001 | SK-09.1 |
| SK-004 | dividir_cuenta | AG-001 | SK-09.1 |
| SK-005 | cobrar_servicio | AG-001 | SK-09.1 |
| SK-006 | emitir_ticket_verifactu | AG-001 | SK-09.1 |
| SK-007 | emitir_factura_completa | AG-001 | SK-09.1 |
| SK-008 | emitir_factura_rectificativa | AG-001 | SK-09.1 |
| SK-009 | gestionar_arqueo_caja | AG-001 | SK-09.1 |
| SK-010 | descontar_stock_por_venta | AG-002 | SK-09.2 |
| SK-011 | calcular_escandallo | AG-002 | SK-09.2 |
| SK-012 | verificar_stock_minimo | AG-002 | SK-09.2 |
| SK-013 | registrar_entrada_mercancia | AG-002 | SK-09.2 |
| SK-014 | realizar_inventario_fisico | AG-002 | SK-09.2 |
| SK-015 | traspasar_stock_entre_almacenes | AG-002 | SK-09.2 |
| SK-016 | calcular_food_cost | AG-002 | SK-09.2 |
| SK-020 | crear_pedido_proveedor | AG-003 | SK-09.3 |
| SK-021 | registrar_albaran_entrada | AG-003 | SK-09.3 |
| SK-022 | registrar_factura_compra | AG-003 | SK-09.3 |
| SK-023 | validar_factura_proveedor | AG-003 | SK-09.3 |
| SK-024 | extraer_datos_factura_ocr | AG-003 | SK-09.3 |
| SK-030 | generar_asiento_venta | AG-004 | SK-09.4 |
| SK-031 | generar_asiento_compra | AG-004 | SK-09.4 |
| SK-032 | generar_asiento_manual | AG-004 | SK-09.4 |
| SK-033 | consultar_libro_diario | AG-004 | SK-09.4 |
| SK-034 | generar_balance_situacion | AG-004 | SK-09.4 |
| SK-035 | generar_cuenta_pyg | AG-004 | SK-09.4 |
| SK-036 | cuadrar_cuentas | AG-004 | SK-09.4 |
| SK-040 | calcular_iva_repercutido_periodo | AG-005 | SK-09.5 |
| SK-041 | calcular_iva_soportado_periodo | AG-005 | SK-09.5 |
| SK-042 | generar_borrador_modelo_303 | AG-005 | SK-09.5 |
| SK-043 | generar_borrador_modelo_347 | AG-005 | SK-09.5 |
| SK-044 | generar_borrador_modelo_111 | AG-005 | SK-09.5 |
| SK-045 | generar_borrador_modelo_115 | AG-005 | SK-09.5 |
| SK-046 | generar_libro_registro_emitidas | AG-005 | SK-09.5 |
| SK-047 | generar_libro_registro_recibidas | AG-005 | SK-09.5 |
| SK-048 | verificar_calendario_fiscal | AG-005 | SK-09.5 |
| SK-049 | calcular_retencion_alquiler | AG-005 | SK-09.5 |
| SK-050 | crear_cuadrante_turnos | AG-006 | SK-09.6 |
| SK-051 | registrar_fichaje | AG-006 | SK-09.6 |
| SK-052 | calcular_horas_trabajadas | AG-006 | SK-09.6 |
| SK-053 | detectar_conflicto_turno | AG-006 | SK-09.6 |
| SK-054 | generar_informe_horas | AG-006 | SK-09.6 |
| SK-060 | crear_reserva | AG-007 | SK-09.7 |
| SK-061 | cancelar_reserva | AG-007 | SK-09.7 |
| SK-062 | detectar_noshow | AG-007 | SK-09.7 |
| SK-063 | acumular_puntos_fidelizacion | AG-007 | SK-09.7 |
| SK-064 | canjear_puntos | AG-007 | SK-09.7 |
| SK-065 | evaluar_subida_nivel | AG-007 | SK-09.7 |
| SK-066 | enviar_comunicacion_personalizada | AG-007 | SK-09.7 |
| SK-067 | generar_carta_digital | AG-007 | SK-09.7 |
| SK-068 | gestionar_consentimientos | AG-007 | SK-09.7 |
| SK-073 | compartir_ticket | AG-001 | SK-09.1 |
| SK-074 | identificar_cliente_al_cobrar | AG-007 | SK-09.7 |
| SK-070 | ejecutar_workflow | AG-008 | SK-09.8 |
| SK-071 | verificar_consistencia_global | AG-008 | SK-09.8 |
| SK-072 | generar_dashboard_ejecutivo | AG-008 | SK-09.8 |
