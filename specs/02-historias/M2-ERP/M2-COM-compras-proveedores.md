# M2-COM — Historias de Usuario: Compras y Proveedores

> **Módulo**: M2-ERP  
> **Ámbito**: COM — Proveedores, Pedidos, Albaranes, Facturas compra, OCR  
> **Agente responsable**: AG-003 (AgenteInventario — compras)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## HU-M2-COM-001 | Alta de proveedores | Must

**COMO** encargado de compras  
**QUIERO** dar de alta proveedores con sus datos fiscales  
**PARA** gestionar pedidos y facturas.

**Criterios de aceptación:**

- **AC-01**: DADO que creo proveedor "Makro" con NIF, dirección, contacto CUANDO guardo ENTONCES queda disponible para crear pedidos y asociar facturas.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-030 (datos fiscales obligatorios: NIF, razón social) |

**Estado implementación:** No implementado

---

## HU-M2-COM-002 | Pedido a proveedor | Must

**COMO** encargado de compras  
**QUIERO** crear un pedido a proveedor  
**PARA** solicitar mercancía.

**Criterios de aceptación:**

- **AC-01**: DADO que necesito cerveza y ternera de Makro CUANDO creo pedido con cantidades y precios pactados ENTONCES el pedido queda registrado con estado "Pendiente".

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Eventos | EVT-011 (PedidoProveedorCreado) |

**Estado implementación:** No implementado

---

## HU-M2-COM-003 | Recepción de mercancía (albarán) | Must

**COMO** encargado de compras  
**QUIERO** registrar la recepción de mercancía (albarán)  
**PARA** verificar que llegó lo que pedí.

**Criterios de aceptación:**

- **AC-01**: DADO que llega el pedido de Makro CUANDO registro el albarán ENTONCES contrasto con el pedido original y marco diferencias (faltas, excesos, productos erróneos).
- **AC-02**: DADO que la recepción es conforme CUANDO confirmo el albarán ENTONCES el stock se actualiza automáticamente con las cantidades recibidas.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Invariantes | INV-016 (stock se actualiza atomicamente) |
| Skills | SK-024 (recepcion_albaran) |
| Eventos | EVT-012 (AlbaranRecibido) |

**Estado implementación:** No implementado

---

## HU-M2-COM-004 | Facturas de proveedores | Must

**COMO** encargado de compras  
**QUIERO** registrar/subir facturas de proveedores  
**PARA** controlar gastos y contabilizar IVA soportado.

**Criterios de aceptación:**

- **AC-01**: DADO que subo la factura de Makro #FM-34521 CUANDO la registro ENTONCES se extrae/valida: proveedor, base imponible, IVA, total, fecha, número de factura.
- **AC-02**: DADO que la factura se registra CUANDO se confirma ENTONCES genera automáticamente el asiento contable de compra y registra el IVA soportado.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-031 (validación datos factura proveedor) |
| Skills | SK-025 (registrar_factura_proveedor) |
| Eventos | EVT-013 (FacturaProveedorRegistrada → trigger asiento) |

**Estado implementación:** No implementado

---

## HU-M2-COM-005 | OCR de facturas | Could

**COMO** encargado de compras  
**QUIERO** que el sistema lea automáticamente (OCR) las facturas de proveedor  
**PARA** no meterlas a mano.

**Criterios de aceptación:**

- **AC-01**: DADO que subo foto/PDF de la factura CUANDO el OCR la procesa ENTONCES extrae: proveedor, NIF, fecha, número, líneas, IVA, total y lo presenta para validación.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-026 (ocr_factura_proveedor) |

**Estado implementación:** No implementado (backlog futuro)
