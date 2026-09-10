# AG-003 — AgenteCompras (Agente de Compras y Proveedores)

> **Código**: AG-003  
> **Módulo principal**: M2-ERP (Compras)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## Responsabilidad

Gestionar el ciclo de compra completo — proveedores, pedidos, recepción, facturas de compra y su registro contable.

---

## Skills que usa

| Skill | Nombre | Descripción |
|-------|--------|-------------|
| SK-020 | crear_pedido_proveedor | Crea pedido con líneas y precios pactados |
| SK-021 | registrar_albaran_entrada | Registra recepción y contrasta con pedido |
| SK-022 | registrar_factura_compra | Registra factura y genera asiento |
| SK-023 | validar_factura_proveedor | Valida datos fiscales de factura |
| SK-024 | extraer_datos_factura_ocr | OCR extrae datos de foto/PDF |

---

## Eventos que escucha

| Evento | Reacción |
|--------|----------|
| EVT-020 (StockBajoMinimo) | Sugiere pedido a proveedor habitual |

---

## Eventos que produce

| Evento | Cuándo |
|--------|--------|
| EVT-022 (AlbaranRecibido) | Al confirmar recepción de mercancía |
| EVT-023 (FacturaCompraRegistrada) | Al registrar factura de proveedor |

---

## Invariantes que respeta

| Invariante | Descripción |
|-----------|-------------|
| INV-033 | Libro IVA recibidas coincide con facturas |

---

## Reglas de negocio clave

| Reglas | Dominio |
|--------|---------|
| RN-005 | IVA soportado deducible |

---

## Historias de usuario asociadas

Ámbito: COM → ver `specs/02-historias/M2-ERP/M2-COM-compras-proveedores.md`
