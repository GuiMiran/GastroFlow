# 07.3 — Eventos de Inventario y Compras

> **Sección**: 07.3 de Capa 07 — Eventos de Dominio  
> **Dominio**: Inventario y Compras  
> **Total eventos**: 5 (EVT-020 a EVT-024)  
> **Agentes productores**: AG-002 AgenteInventario, AG-003 AgenteCompras  
> **Fecha**: 2026-03-14

---

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

### Trazabilidad

| EVT | Agentes que escuchan | Skills disparados | HU relacionadas |
|-----|---------------------|-------------------|-----------------|
| EVT-020 | AG-002, AG-003 | SK-012, SK-020 | HU-M2-INV-002 |
| EVT-021 | AG-002 | SK-012 | HU-M2-INV-001 |
| EVT-022 | AG-002, AG-003 | SK-013, SK-021 | HU-M2-COM-002 |
| EVT-023 | AG-003, AG-004, AG-005 | SK-022, SK-031 | HU-M2-COM-003 |
| EVT-024 | AG-002 | SK-014 | HU-M2-INV-003 |
