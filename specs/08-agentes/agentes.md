# CAPA 08 — AGENTES

> **⚠️ DEPRECATED** — Este archivo monolítico ha sido reemplazado por la estructura modular.
> Consultar los archivos individuales por agente:
>
> - `_index.md` → Índice con directorio, matriz y flujo de eventos
> - `AG-001-agente-tpv.md` a `AG-009-agente-documentacion.md` → Un archivo por agente
>
> **No editar este archivo. Solo se conserva como referencia histórica.**

> Actores de IA autónomos que operan sobre el dominio.  
> No son técnicos: son roles funcionales autónomos que consumen specs y ejecutan.  
> Cada agente: Nombre, Responsabilidad, Skills, Eventos que escucha/produce, Invariantes.

---

## AG-001: AgenteTPV (Agente de Punto de Venta)

**Responsabilidad**: Gestionar toda la operación de sala — mesas, comandas, cobros y facturación en tiempo real.

**Skills que usa**:
- SK-001: abrir_mesa
- SK-002: tomar_comanda
- SK-003: calcular_cuenta
- SK-004: dividir_cuenta
- SK-005: cobrar_servicio
- SK-006: emitir_ticket_verifactu
- SK-007: emitir_factura_completa
- SK-008: emitir_factura_rectificativa
- SK-009: gestionar_arqueo_caja

**Eventos que escucha**:
- EVT-052 (ReservaCreada) → para marcar mesas como reservadas en el mapa
- EVT-053 (ReservaCancelada) → para liberar mesas

**Eventos que produce**:
- EVT-001 (MesaAbierta)
- EVT-002 (ComandaRegistrada)
- EVT-004 (TicketEmitido)
- EVT-005 (FacturaCompletaEmitida)
- EVT-006 (FacturaRectificativaEmitida)
- EVT-007 (LineaComandaAnulada)
- EVT-010 (TurnoCajaAbierto)
- EVT-011 (TurnoCajaCerrado)

**Invariantes que respeta**:
- INV-001 (secuencialidad de numeración)
- INV-002 (integridad del total)
- INV-003 (cuadre de IVA)
- INV-007 (inalterabilidad VeriFactu)
- INV-008 (cadena de hash)
- INV-010 (estado de mesa coherente)
- INV-013 (división de cuenta cuadra)
- INV-014 (cobro cubre total)
- INV-015 (arqueo suma correcta)

**Reglas de negocio clave**:
- RN-001 a RN-003 (IVA hostelería)
- RN-010 a RN-017 (facturación)
- RN-030 a RN-038 (operativas TPV)

---

## AG-002: AgenteInventario (Agente de Inventario y Stock)

**Responsabilidad**: Mantener el inventario actualizado, gestionar escandallos, alertar de stock bajo y coordinar con compras.

**Skills que usa**:
- SK-010: descontar_stock_por_venta
- SK-011: calcular_escandallo
- SK-012: verificar_stock_minimo
- SK-013: registrar_entrada_mercancia
- SK-014: realizar_inventario_fisico
- SK-015: traspasar_stock_entre_almacenes
- SK-016: calcular_food_cost

**Eventos que escucha**:
- EVT-004 (TicketEmitido) → para descontar stock
- EVT-022 (AlbaranRecibido) → para sumar stock
- EVT-023 (FacturaCompraRegistrada) → para actualizar precios de coste

**Eventos que produce**:
- EVT-020 (StockBajoMinimo)
- EVT-021 (StockNegativo)
- EVT-024 (InventarioFisicoRealizado)

**Invariantes que respeta**:
- INV-020 (stock trazable)
- INV-021 (movimiento con origen)
- INV-022 (coste escandallo determinista)

**Reglas de negocio clave**:
- RN-040 a RN-044 (inventario y escandallos)

---

## AG-003: AgenteCompras (Agente de Compras y Proveedores)

**Responsabilidad**: Gestionar el ciclo de compra completo — proveedores, pedidos, recepción, facturas de compra y su registro contable.

**Skills que usa**:
- SK-020: crear_pedido_proveedor
- SK-021: registrar_albaran_entrada
- SK-022: registrar_factura_compra
- SK-023: validar_factura_proveedor
- SK-024: extraer_datos_factura_ocr

**Eventos que escucha**:
- EVT-020 (StockBajoMinimo) → para sugerir pedido a proveedor habitual

**Eventos que produce**:
- EVT-022 (AlbaranRecibido)
- EVT-023 (FacturaCompraRegistrada)

**Invariantes que respeta**:
- INV-033 (libro IVA recibidas coincide con facturas)

**Reglas de negocio clave**:
- RN-005 (IVA soportado deducible)

---

## AG-004: AgenteContable (Agente de Contabilidad)

**Responsabilidad**: Mantener la contabilidad al día — asientos automáticos, libros contables, balance y cuenta de PyG.

**Skills que usa**:
- SK-030: generar_asiento_venta
- SK-031: generar_asiento_compra
- SK-032: generar_asiento_manual
- SK-033: consultar_libro_diario
- SK-034: generar_balance_situacion
- SK-035: generar_cuenta_pyg
- SK-036: cuadrar_cuentas

**Eventos que escucha**:
- EVT-004 (TicketEmitido) → para generar asiento de venta
- EVT-006 (FacturaRectificativaEmitida) → para generar asiento de ajuste
- EVT-023 (FacturaCompraRegistrada) → para generar asiento de compra

**Eventos que produce**:
- EVT-030 (AsientoContableCreado)

**Invariantes que respeta**:
- INV-030 (partida doble cuadra)
- INV-031 (balance cuadra)
- INV-032 (libro IVA emitidas coincide)
- INV-033 (libro IVA recibidas coincide)

**Reglas de negocio clave**:
- RN-080 a RN-083 (reglas contables PGC Pymes)

---

## AG-005: AgenteFiscal (Agente Fiscal y Tributario)

**Responsabilidad**: Calcular y preparar todas las obligaciones fiscales — IVA, retenciones, modelos tributarios, calendario fiscal.

**Skills que usa**:
- SK-040: calcular_iva_repercutido_periodo
- SK-041: calcular_iva_soportado_periodo
- SK-042: generar_borrador_modelo_303
- SK-043: generar_borrador_modelo_347
- SK-044: generar_borrador_modelo_111
- SK-045: generar_borrador_modelo_115
- SK-046: generar_libro_registro_emitidas
- SK-047: generar_libro_registro_recibidas
- SK-048: verificar_calendario_fiscal
- SK-049: calcular_retencion_alquiler

**Eventos que escucha**:
- EVT-004 (TicketEmitido) → para acumular IVA repercutido
- EVT-023 (FacturaCompraRegistrada) → para acumular IVA soportado
- EVT-030 (AsientoContableCreado) → para verificar coherencia fiscal-contable

**Eventos que produce**:
- EVT-031 (TrimestreFiscalProximoACerrar)
- EVT-032 (Modelo303Generado)

**Invariantes que respeta**:
- INV-004 (IVA repercutido trimestral correcto)
- INV-005 (IVA soportado trimestral correcto)
- INV-006 (resultado 303 = repercutido - soportado)

**Reglas de negocio clave**:
- RN-001 a RN-007 (todas las reglas de IVA)
- RN-020 a RN-025 (modelos tributarios)

---

## AG-006: AgenteRRHH (Agente de Recursos Humanos)

**Responsabilidad**: Gestionar cuadrantes de turnos, fichajes, control de horas y cumplimiento laboral.

**Skills que usa**:
- SK-050: crear_cuadrante_turnos
- SK-051: registrar_fichaje
- SK-052: calcular_horas_trabajadas
- SK-053: detectar_conflicto_turno
- SK-054: generar_informe_horas

**Eventos que escucha**:
- (Escucha fichajes y asignaciones de turno)

**Eventos que produce**:
- EVT-040 (EmpleadoFicho)
- EVT-041 (ConflictoTurnoDetectado)

**Invariantes que respeta**:
- INV-040 (no turnos solapados)
- INV-041 (12h entre turnos)
- INV-042 (80h extra máximo)

**Reglas de negocio clave**:
- RN-050 a RN-054 (reglas laborales)

---

## AG-007: AgenteCRM (Agente de Relación con Cliente)

**Responsabilidad**: Gestionar la relación con el cliente — reservas, fidelización, comunicaciones, carta digital.

**Skills que usa**:
- SK-060: crear_reserva
- SK-061: cancelar_reserva
- SK-062: detectar_noshow
- SK-063: acumular_puntos_fidelizacion
- SK-064: canjear_puntos
- SK-065: evaluar_subida_nivel
- SK-066: enviar_comunicacion_personalizada
- SK-067: generar_carta_digital
- SK-068: gestionar_consentimientos

**Eventos que escucha**:
- EVT-004 (TicketEmitido) → para acumular puntos al cliente
- EVT-001 (MesaAbierta) → para marcar reserva como "cumplida" si aplica

**Eventos que produce**:
- EVT-050 (ClienteRegistrado)
- EVT-051 (PuntosAcumulados)
- EVT-052 (ReservaCreada)
- EVT-053 (ReservaCancelada)
- EVT-054 (NoShowDetectado)

**Invariantes que respeta**:
- INV-050 (puntos ≥ 0)
- INV-051 (canjeo ≤ saldo)
- INV-052 (consentimiento antes de comunicación)

**Reglas de negocio clave**:
- RN-060 a RN-063 (protección de datos)
- RN-070 (alérgenos — carta digital)

---

## AG-008: AgenteOrquestador (Agente Director)

**Responsabilidad**: Orquestar la coordinación entre los demás agentes. No ejecuta lógica de negocio directa: coordina flujos (workflows) que involucran a múltiples agentes.

**Skills que usa**:
- SK-070: ejecutar_workflow
- SK-071: verificar_consistencia_global
- SK-072: generar_dashboard_ejecutivo

**Eventos que escucha**: TODOS los eventos (monitoriza el sistema completo).

**Eventos que produce**: Alertas de inconsistencia, informes de estado.

**Invariantes que respeta**: TODAS (es el verificador global).

---

## AG-009 — AgenteDocumentacion

**Responsabilidad**: Mantener la trazabilidad, versionado y consistencia de la documentación de especificaciones del proyecto. Gestiona historias de usuario (codificación, ámbito, subámbito), criterios de aceptación, estado de implementación y correspondencia evolutiva entre iteraciones.

**Skills que usa**:
- SK-080: validar_codificacion_historias (verifica formato HU-{Módulo}-{Ámbito}-{Seq})
- SK-081: verificar_trazabilidad_completa (cruza historias ↔ reglas ↔ invariantes ↔ contratos ↔ skills ↔ eventos)
- SK-082: generar_informe_cobertura (% de historias con trazabilidad completa)
- SK-083: detectar_historias_huerfanas (historias sin regla/invariante asociada)
- SK-084: actualizar_estado_implementacion (sincroniza estado de historias con código real)

**Eventos que escucha**:
- EVT-ALL (TicketEmitido, FacturaCompletaEmitida, etc.) — para verificar implementación vs especificación
- IteracionCompletada — para generar snapshot evolutivo

**Eventos que produce**:
- DocumentacionDesactualizada — cuando implementación y spec divergen
- CoberturaInsuficiente — cuando hay historias sin trazabilidad

**Invariantes que respeta**:
- INV-DOC-001: Toda historia de usuario debe tener al menos un criterio de aceptación.
- INV-DOC-002: Todo código de historia sigue el formato `HU-M{n}-{ÁMBITO}-{seq}`.
- INV-DOC-003: La correspondencia entre códigos antiguos y nuevos debe ser biyectiva (sin duplicados ni pérdidas).

**Reglas de negocio**:
- RN-DOC-001: Al completar una iteración, se genera snapshot del estado de todas las historias (implementada/parcial/pendiente).
- RN-DOC-002: Los ficheros de historias se organizan por módulo/ámbito en chunks pequeños (<100 líneas) para consumo óptimo por agentes IA.

---
