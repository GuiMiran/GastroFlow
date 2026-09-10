# 07.4 — Eventos Contables y Fiscales

> **Sección**: 07.4 de Capa 07 — Eventos de Dominio  
> **Dominio**: Contabilidad y Fiscal  
> **Total eventos**: 4 (EVT-030 a EVT-033)
> **Agentes productores**: AG-004 AgenteContable, AG-005 AgenteFiscal
> **Fecha**: 2026-03-15

---

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

**EVT-033: AsientoVinculadoATicket**  
- Ocurre cuando: El asiento contable generado automáticamente por una venta queda vinculado al ticket (campo `asientoContableId` actualizado).
- Datos del evento: id_asiento, id_ticket, numero_ticket, codigo_completo, fecha, establecimientoId.
- DISPARA:
  1. Actualizar el estado del ciclo de vida del ticket a **ASIENTO_GENERADO**.
  2. Confirmar en el dashboard fiscal que la operación tiene reflejo contable.
  3. Si `libroRegistroEmitida` ya existe → estado avanza a **LIBRO_IVA_REGISTRADO**.
  4. Si `RegistroVeriFactu` ya existe → estado avanza a **VERIFACTU_FIRMADA** → **CONSERVADA**.
- **Nota fiscal**: Este evento es la prueba documental de que ninguna venta existe sin asiento. Cumple el principio de correlación ingresos-gastos del PGC (RN-082) y facilita la reconciliación con el modelo 303 (EVT-032).
  2. Actualizar estado en calendario fiscal.

---

### Trazabilidad

| EVT | Agentes que escuchan | Skills disparados | HU relacionadas |
|-----|---------------------|-------------------|-----------------|
| EVT-030 | AG-004 | SK-030, SK-031, SK-032 | HU-M3-ASI-001 |
| EVT-031 | AG-005, AG-008 | SK-042, SK-044, SK-045, SK-048 | HU-M3-IMP-001 |
| EVT-032 | AG-005 | SK-042 | HU-M3-IMP-001 |
